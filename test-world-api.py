"""
World Labs Marble API - Test Script
====================================
Tests the World Generation API with text and image inputs.
Uses Draft (Marble 0.1-mini) by default to conserve credits.

Credit costs (Draft / Marble 0.1-mini):
  - Text input:      230 credits (80 pano + 150 world)
  - Image input:     230 credits (80 pano + 150 world)
  - Image (pano):    150 credits (150 world only)

Credit costs (Standard / Marble 0.1-plus):
  - Text input:      1,580 credits (80 pano + 1,500 world)
  - Image input:     1,580 credits (80 pano + 1,500 world)
  - Image (pano):    1,500 credits (1,500 world only)

Usage:
  export WLT_API_KEY="your_api_key_here"

  # Test with text prompt (cheapest - 230 credits on Draft)
  python test_marble_api.py --mode text --prompt "A cozy 1960s kitchen with floral wallpaper"

  # Test with image URL
  python test_marble_api.py --mode image-url --image-url "https://example.com/photo.jpg"

  # Test with local image file
  python test_marble_api.py --mode image-file --image-path "./childhood_photo.jpg"

  # Use Standard quality (more credits but better quality)
  python test_marble_api.py --mode text --prompt "A warm living room" --quality standard

  # Add a text hint alongside an image
  python test_marble_api.py --mode image-url --image-url "https://example.com/photo.jpg" --prompt "A 1970s suburban home interior"
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error


BASE_URL = "https://api.worldlabs.ai/marble/v1"


def get_api_key():
    key = os.environ.get("WLT_API_KEY")
    if not key:
        print("ERROR: Set your API key with: export WLT_API_KEY='your_key_here'")
        print("Get your key at: https://platform.worldlabs.ai/api-keys")
        sys.exit(1)
    return key


def api_request(method, path, api_key, data=None, binary_data=None, extra_headers=None):
    """Make an API request and return parsed JSON (or raw response for uploads)."""
    url = f"{BASE_URL}{path}" if path.startswith("/") else path
    headers = {"WLT-Api-Key": api_key}

    if extra_headers:
        headers.update(extra_headers)

    if binary_data is not None:
        req = urllib.request.Request(
            url, data=binary_data, headers=headers, method=method
        )
    elif data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            if resp.headers.get("Content-Type", "").startswith("application/json"):
                return json.loads(raw)
            return raw
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        print(f"\nAPI ERROR {e.code}: {e.reason}")
        print(f"Response: {error_body}")
        sys.exit(1)


def poll_operation(api_key, operation_id, timeout=600, interval=10):
    """Poll an operation until it completes or times out."""
    print(f"\nPolling operation: {operation_id}")
    print(f"Timeout: {timeout}s | Poll interval: {interval}s")
    print("-" * 50)

    start = time.time()
    while time.time() - start < timeout:
        result = api_request("GET", f"/operations/{operation_id}", api_key)

        status = result.get("metadata", {}).get("progress", {}).get("status", "UNKNOWN")
        description = (
            result.get("metadata", {}).get("progress", {}).get("description", "")
        )
        elapsed = int(time.time() - start)

        print(f"  [{elapsed:>3}s] {status}: {description}")

        if result.get("done"):
            if result.get("error"):
                print(f"\nGENERATION FAILED: {result['error']}")
                return None
            return result

        time.sleep(interval)

    print(f"\nTIMEOUT after {timeout}s")
    return None


def print_world_result(result):
    """Pretty-print the generated world details."""
    response = result.get("response", {})
    assets = response.get("assets", {})

    print("\n" + "=" * 60)
    print("WORLD GENERATED SUCCESSFULLY")
    print("=" * 60)

    world_id = response.get("id", "N/A")
    marble_url = response.get("world_marble_url", "N/A")
    caption = assets.get("caption", "N/A")

    print(f"\n  World ID:    {world_id}")
    print(f"  Marble URL:  {marble_url}")
    print(f"  Caption:     {caption[:100]}{'...' if len(caption) > 100 else ''}")

    # Splat URLs
    splats = assets.get("splats", {}).get("spz_urls", {})
    if splats:
        print(f"\n  Gaussian Splats:")
        for quality, url in splats.items():
            print(f"    {quality}: {url[:80]}...")

    # Mesh
    mesh_url = assets.get("mesh", {}).get("collider_mesh_url")
    if mesh_url:
        print(f"\n  Collider Mesh: {mesh_url[:80]}...")

    # Panorama
    pano_url = assets.get("imagery", {}).get("pano_url")
    if pano_url:
        print(f"  Panorama:      {pano_url[:80]}...")

    # Thumbnail
    thumb_url = assets.get("thumbnail_url")
    if thumb_url:
        print(f"  Thumbnail:     {thumb_url[:80]}...")

    print(f"\n  >> View your world: {marble_url}")
    print("=" * 60)

    return response


def test_text_generation(api_key, prompt, model):
    """Generate a world from a text prompt."""
    print(f"\n{'='*60}")
    print(f"TEST: Text-to-World Generation")
    print(f"{'='*60}")
    print(f"  Prompt: {prompt}")
    print(f"  Model:  {model}")
    cost = 230 if model == "Marble 0.1-mini" else 1580
    print(f"  Est. cost: ~{cost} credits")

    data = {
        "display_name": f"Test: {prompt[:40]}",
        "model": model,
        "world_prompt": {
            "type": "text",
            "text_prompt": prompt,
        },
    }

    print("\nSubmitting generation request...")
    result = api_request("POST", "/worlds:generate", api_key, data=data)
    operation_id = result["operation_id"]

    completed = poll_operation(api_key, operation_id)
    if completed:
        return print_world_result(completed)
    return None


def test_image_url_generation(api_key, image_url, text_prompt, model):
    """Generate a world from a public image URL."""
    print(f"\n{'='*60}")
    print(f"TEST: Image URL-to-World Generation")
    print(f"{'='*60}")
    print(f"  Image URL: {image_url}")
    print(f"  Text hint: {text_prompt or '(auto-caption)'}")
    print(f"  Model:     {model}")
    cost = 230 if model == "Marble 0.1-mini" else 1580
    print(f"  Est. cost: ~{cost} credits")

    data = {
        "display_name": "Test: Image URL World",
        "model": model,
        "world_prompt": {
            "type": "image",
            "image_prompt": {
                "source": "uri",
                "uri": image_url,
            },
        },
    }
    if text_prompt:
        data["world_prompt"]["text_prompt"] = text_prompt

    print("\nSubmitting generation request...")
    result = api_request("POST", "/worlds:generate", api_key, data=data)
    operation_id = result["operation_id"]

    completed = poll_operation(api_key, operation_id)
    if completed:
        return print_world_result(completed)
    return None


def test_image_file_generation(api_key, image_path, text_prompt, model):
    """Generate a world from a local image file."""
    print(f"\n{'='*60}")
    print(f"TEST: Local Image File-to-World Generation")
    print(f"{'='*60}")
    print(f"  Image:     {image_path}")
    print(f"  Text hint: {text_prompt or '(auto-caption)'}")
    print(f"  Model:     {model}")
    cost = 230 if model == "Marble 0.1-mini" else 1580
    print(f"  Est. cost: ~{cost} credits")

    if not os.path.exists(image_path):
        print(f"ERROR: File not found: {image_path}")
        sys.exit(1)

    file_name = os.path.basename(image_path)
    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "jpg"

    # Step 1: Prepare upload
    print("\n[1/3] Preparing upload...")
    prep_data = {
        "file_name": file_name,
        "kind": "image",
        "extension": ext,
    }
    prep_result = api_request(
        "POST", "/media-assets:prepare_upload", api_key, data=prep_data
    )

    media_asset_id = prep_result["media_asset"]["id"]
    upload_url = prep_result["upload_info"]["upload_url"]
    upload_method = prep_result["upload_info"]["upload_method"]
    required_headers = prep_result["upload_info"].get("required_headers", {})

    print(f"  Media Asset ID: {media_asset_id}")

    # Step 2: Upload the file
    print("[2/3] Uploading image...")
    with open(image_path, "rb") as f:
        file_data = f.read()
    print(f"  File size: {len(file_data):,} bytes")

    upload_headers = {}
    upload_headers.update(required_headers)

    upload_req = urllib.request.Request(
        upload_url,
        data=file_data,
        headers=upload_headers,
        method=upload_method,
    )
    try:
        with urllib.request.urlopen(upload_req) as resp:
            print(f"  Upload status: {resp.status}")
    except urllib.error.HTTPError as e:
        print(f"  Upload FAILED: {e.code} {e.reason}")
        print(f"  Response: {e.read().decode('utf-8', errors='replace')}")
        sys.exit(1)

    # Step 3: Generate world
    print("[3/3] Submitting generation request...")
    gen_data = {
        "display_name": f"Test: {file_name}",
        "model": model,
        "world_prompt": {
            "type": "image",
            "image_prompt": {
                "source": "media_asset",
                "media_asset_id": media_asset_id,
            },
        },
    }
    if text_prompt:
        gen_data["world_prompt"]["text_prompt"] = text_prompt

    result = api_request("POST", "/worlds:generate", api_key, data=gen_data)
    operation_id = result["operation_id"]

    completed = poll_operation(api_key, operation_id)
    if completed:
        return print_world_result(completed)
    return None


def main():
    parser = argparse.ArgumentParser(
        description="Test World Labs Marble API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Text prompt (cheapest test - 230 credits on Draft)
  python test_marble_api.py --mode text --prompt "A 1960s kitchen with floral wallpaper"

  # Image from URL
  python test_marble_api.py --mode image-url --image-url "https://example.com/photo.jpg"

  # Local image file
  python test_marble_api.py --mode image-file --image-path ./old_photo.jpg

  # Standard quality (better but costs more)
  python test_marble_api.py --mode text --prompt "A warm living room" --quality standard
        """,
    )
    parser.add_argument(
        "--mode",
        choices=["text", "image-url", "image-file"],
        required=True,
        help="Generation mode",
    )
    parser.add_argument(
        "--prompt",
        type=str,
        help="Text prompt (required for text mode, optional for image modes)",
    )
    parser.add_argument(
        "--image-url", type=str, help="Public image URL (for image-url mode)"
    )
    parser.add_argument(
        "--image-path", type=str, help="Local image file path (for image-file mode)"
    )
    parser.add_argument(
        "--quality",
        choices=["draft", "standard"],
        default="draft",
        help="Generation quality: draft (fast/cheap) or standard (slow/expensive). Default: draft",
    )

    args = parser.parse_args()

    model = "Marble 0.1-mini" if args.quality == "draft" else "Marble 0.1-plus"
    api_key = get_api_key()

    print("World Labs Marble API Test")
    print(f"Quality: {args.quality} ({model})")
    print(f"Mode:    {args.mode}")

    if args.mode == "text":
        if not args.prompt:
            parser.error("--prompt is required for text mode")
        test_text_generation(api_key, args.prompt, model)

    elif args.mode == "image-url":
        if not args.image_url:
            parser.error("--image-url is required for image-url mode")
        test_image_url_generation(api_key, args.image_url, args.prompt, model)

    elif args.mode == "image-file":
        if not args.image_path:
            parser.error("--image-path is required for image-file mode")
        test_image_file_generation(api_key, args.image_path, args.prompt, model)


if __name__ == "__main__":
    main()
