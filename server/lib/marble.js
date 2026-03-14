const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://api.worldlabs.ai/marble/v1';

/**
 * Make an API request to World Labs API
 */
async function apiRequest(method, pathname, apiKey, data = null, binaryData = null) {
  const url = pathname.startsWith('http') ? pathname : BASE_URL + pathname;
  
  const options = {
    method,
    headers: {
      'WLT-Api-Key': apiKey,
    },
  };

  if (data) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  } else if (binaryData) {
    options.body = binaryData;
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${errorBody}`);
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return response;
  } catch (error) {
    console.error(`API Request Failed: ${error.message}`);
    throw error;
  }
}

/**
 * Upload an image file and return the media asset ID
 * @param {string} filePath - Path to the image file
 * @param {string} apiKey - World Labs API key
 * @returns {Promise<string>} - Media asset ID
 */
async function uploadImage(filePath, apiKey) {
  console.log(`\nUploading image: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).substring(1) || 'jpg';
  const fileSize = fs.statSync(filePath).size;

  // Step 1: Prepare upload
  console.log('[1/3] Preparing upload...');
  const prepData = {
    file_name: fileName,
    kind: 'image',
    extension: ext,
  };

  const prepResult = await apiRequest(
    'POST',
    '/media-assets:prepare_upload',
    apiKey,
    prepData
  );

  const mediaAssetId = prepResult.media_asset.id;
  const uploadUrl = prepResult.upload_info.upload_url;
  const uploadMethod = prepResult.upload_info.upload_method;
  const requiredHeaders = prepResult.upload_info.required_headers || {};

  console.log(`  Media Asset ID: ${mediaAssetId}`);

  // Step 2: Upload the file
  console.log('[2/3] Uploading image...');
  const fileData = fs.readFileSync(filePath);
  console.log(`  File size: ${fileSize.toLocaleString()} bytes`);

  const uploadOptions = {
    method: uploadMethod,
    headers: {
      ...requiredHeaders,
    },
    body: fileData,
  };

  try {
    const uploadResponse = await fetch(uploadUrl, uploadOptions);
    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    console.log(`  Upload status: ${uploadResponse.status} OK`);
  } catch (error) {
    console.error(`  Upload FAILED: ${error.message}`);
    throw error;
  }

  return mediaAssetId;
}

/**
 * Generate a world from text or image
 * @param {Object} options - Generation options
 * @param {string} options.apiKey - World Labs API key
 * @param {string} options.displayName - Display name for the world
 * @param {string} [options.textPrompt] - Text description of the world
 * @param {string} [options.imageUrl] - Public image URL for world generation
 * @param {string} [options.mediaAssetId] - Media asset ID from uploaded image
 * @param {string} [options.model='Marble 0.1-mini'] - Model to use (Marble 0.1-mini or Marble 0.1-plus)
 * @returns {Promise<string>} - Operation ID
 */
async function generateWorld(options) {
  const {
    apiKey,
    displayName,
    textPrompt,
    imageUrl,
    mediaAssetId,
    model = 'Marble 0.1-mini',
  } = options;

  if (!apiKey) throw new Error('apiKey is required');
  if (!displayName) throw new Error('displayName is required');
  if (!textPrompt && !imageUrl && !mediaAssetId) {
    throw new Error('One of textPrompt, imageUrl, or mediaAssetId is required');
  }

  const worldPrompt = {};

  if (textPrompt) {
    console.log(`\nGenerating world from text: "${textPrompt}"`);
    worldPrompt.type = 'text';
    worldPrompt.text_prompt = textPrompt;
  } else if (imageUrl) {
    console.log(`\nGenerating world from image URL: ${imageUrl}`);
    worldPrompt.type = 'image';
    worldPrompt.image_prompt = {
      source: 'uri',
      uri: imageUrl,
    };
  } else if (mediaAssetId) {
    console.log(`\nGenerating world from uploaded image: ${mediaAssetId}`);
    worldPrompt.type = 'image';
    worldPrompt.image_prompt = {
      source: 'media_asset',
      media_asset_id: mediaAssetId,
    };
  }

  const data = {
    display_name: displayName,
    model,
    world_prompt: worldPrompt,
  };

  console.log(`  Model: ${model}`);
  const estimatedCost = model === 'Marble 0.1-mini' ? 230 : 1580;
  console.log(`  Est. cost: ~${estimatedCost} credits`);

  console.log('\nSubmitting generation request...');
  const result = await apiRequest('POST', '/worlds:generate', apiKey, data);
  const operationId = result.operation_id;

  console.log(`  Operation ID: ${operationId}`);
  return operationId;
}

/**
 * Poll an operation until completion
 * @param {string} apiKey - World Labs API key
 * @param {string} operationId - Operation ID to poll
 * @param {number} [timeout=600] - Timeout in seconds
 * @param {number} [interval=10] - Poll interval in seconds
 * @returns {Promise<Object|null>} - Completed operation result or null on timeout
 */
async function pollOperation(apiKey, operationId, timeout = 600, interval = 10) {
  console.log(`\nPolling operation: ${operationId}`);
  console.log(`Timeout: ${timeout}s | Poll interval: ${interval}s`);
  console.log('-'.repeat(50));

  const startTime = Date.now();

  while (Date.now() - startTime < timeout * 1000) {
    try {
      const result = await apiRequest('GET', `/operations/${operationId}`, apiKey);
      
      const progress = result.metadata?.progress || {};
      const status = progress.status || 'UNKNOWN';
      const description = progress.description || '';
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      console.log(`  [${elapsed.toString().padStart(3, ' ')}s] ${status}: ${description}`);

      if (result.done) {
        if (result.error) {
          console.error(`\nGENERATION FAILED: ${result.error}`);
          return null;
        }
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    } catch (error) {
      console.error(`Poll error: ${error.message}`);
      throw error;
    }
  }

  console.log(`\nTIMEOUT after ${timeout}s`);
  return null;
}

/**
 * Get world generation result
 * @param {Object} result - Completed operation result
 * @returns {Object} - World assets and metadata
 */
function parseWorldResult(result) {
  const response = result.response || {};
  const assets = response.assets || {};

  const worldData = {
    worldId: response.id,
    marbleUrl: response.world_marble_url,
    caption: assets.caption,
    splats: assets.splats?.spz_urls || {},
    mesh: assets.mesh?.collider_mesh_url,
    panorama: assets.imagery?.pano_url,
    thumbnail: assets.thumbnail_url,
  };

  return worldData;
}

module.exports = {
  uploadImage,
  generateWorld,
  pollOperation,
  parseWorldResult,
};
