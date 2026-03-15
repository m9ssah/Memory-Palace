"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import Spinner from "@/components/ui/Spinner";
import ConversationPanel from "@/components/viewer/ConversationPanel";
import type { Memory } from "@/types";

type SplatViewerSceneProps = {
  memory: Memory;
};

const CAMERA_EYE_HEIGHT = 0.1;
const CAMERA_START_DISTANCE = 1;

type CenterableSplatScene = THREE.Object3D & {
  splatBuffer?: {
    sceneCenter?: THREE.Vector3;
  };
};

function getMemoryYear(createdAt?: string): string | null {
  if (!createdAt) return null;
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return String(parsed.getFullYear());
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    const meshLike = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry;
      material?: THREE.Material | THREE.Material[];
    };

    meshLike.geometry?.dispose();

    const materials = meshLike.material
      ? Array.isArray(meshLike.material)
        ? meshLike.material
        : [meshLike.material]
      : [];

    materials.forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) {
          value.dispose();
        }
      });
      material.dispose();
    });
  });
}

export default function SplatViewerScene({ memory }: SplatViewerSceneProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const interactionLayerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number>(0);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const viewerRef = useRef<GaussianSplats3D.DropInViewer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const fadeTimersRef = useRef<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const year = useMemo(() => getMemoryYear(memory.createdAt), [memory.createdAt]);
  const hasRenderableSplat = Boolean(memory.splatUrl);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Create a session in Supabase when the viewer mounts
  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memoryId: memory.id, worldId: memory.worldId ?? null }),
        });
        if (res.ok) {
          const data = await res.json();
          sessionIdRef.current = data.sessionId;
          setSessionId(data.sessionId);
        }
      } catch (err) {
        console.error("Failed to create session:", err);
      }
    }
    initSession();

    return () => {
      // End the session when leaving
      if (sessionIdRef.current) {
        fetch(`/api/sessions/${sessionIdRef.current}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end" }),
        }).catch(() => {});
      }
    };
  }, [memory.id, memory.worldId]);

  const handleSessionEnd = useCallback((transcript: string) => {
    if (!transcript.trim() || !sessionIdRef.current) return;
    fetch(`/api/sessions/${sessionIdRef.current}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
      keepalive: true,
    }).catch((err) => {
      console.error("Failed to send transcript for analysis:", err);
    });
  }, []);

  useEffect(() => {
    return () => {
      fadeTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      fadeTimersRef.current = [];
    };
  }, []);

  const queueFadeTimer = (callback: () => void, delayMs: number) => {
    const timerId = window.setTimeout(() => {
      fadeTimersRef.current = fadeTimersRef.current.filter((id) => id !== timerId);
      callback();
    }, delayMs);
    fadeTimersRef.current.push(timerId);
  };

  useEffect(() => {
    if (!memory.splatUrl) return;

    const container = containerRef.current;
    const interactionLayer = interactionLayerRef.current;
    if (!container || !interactionLayer) return;

    let isDisposed = false;
    let isPointerDown = false;
    let previousX = 0;
    let previousY = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let yaw = 0;
    let pitch = 0;
    const keys: Record<string, boolean> = {};
    const moveDirection = new THREE.Vector3();
    const moveSpeed = 0.06;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0a1e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(72, 1, 0.01, 500);
    camera.rotation.order = "YXZ";
    camera.position.set(0, CAMERA_EYE_HEIGHT, 4);
    camera.lookAt(0, CAMERA_EYE_HEIGHT, 0);
    cameraRef.current = camera;
    scene.add(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight, false);
    renderer.domElement.className = "h-full w-full";
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const viewer = new GaussianSplats3D.DropInViewer({
      gpuAcceleratedSort: false,
      sharedMemoryForWorkers: false,
      renderer,
      camera,
      scene,
    });
    viewerRef.current = viewer;
    scene.add(viewer);
    const maybeViewer = viewer as unknown as { update?: () => void };

    const updateCameraRotation = () => {
      yaw += (targetYaw - yaw) * 0.09;
      pitch += (targetPitch - pitch) * 0.09;
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
      camera.position.y = CAMERA_EYE_HEIGHT;
    };

    const animate = () => {
      animationFrameRef.current = window.requestAnimationFrame(animate);
      updateCameraRotation();

      moveDirection.set(0, 0, 0);
      if (keys.KeyW) moveDirection.z -= 1;
      if (keys.KeyS) moveDirection.z += 1;
      if (keys.KeyA) moveDirection.x -= 1;
      if (keys.KeyD) moveDirection.x += 1;

      if (moveDirection.lengthSq() > 0) {
        moveDirection.normalize();
        moveDirection.applyEuler(new THREE.Euler(0, yaw, 0));
        moveDirection.multiplyScalar(moveSpeed);
        camera.position.x += moveDirection.x;
        camera.position.z += moveDirection.z;
        camera.position.y = CAMERA_EYE_HEIGHT;
      }

      if (typeof maybeViewer.update === "function") {
        maybeViewer.update();
      }

      renderer.render(scene, camera);
    };

    const setCanvasSize = () => {
      if (!container) return;
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const beginPointer = (clientX: number, clientY: number) => {
      isPointerDown = true;
      previousX = clientX;
      previousY = clientY;
      interactionLayer.style.cursor = "grabbing";
    };

    const endPointer = () => {
      isPointerDown = false;
      interactionLayer.style.cursor = "grab";
    };

    const updatePointer = (clientX: number, clientY: number, scaleX: number, scaleY: number) => {
      if (!isPointerDown) return;
      targetYaw -= (clientX - previousX) * scaleX;
      targetPitch -= (clientY - previousY) * scaleY;
      targetPitch = Math.max(-0.48, Math.min(0.48, targetPitch));
      previousX = clientX;
      previousY = clientY;
    };

    const onMouseDown = (event: MouseEvent) => beginPointer(event.clientX, event.clientY);
    const onMouseMove = (event: MouseEvent) => updatePointer(event.clientX, event.clientY, 0.0035, 0.0025);
    const onMouseUp = () => endPointer();

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      beginPointer(touch.clientX, touch.clientY);
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      updatePointer(touch.clientX, touch.clientY, 0.004, 0.003);
    };

    const onTouchEnd = () => endPointer();

    const onKeyDown = (event: KeyboardEvent) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
        event.preventDefault();
      }
      keys[event.code] = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keys[event.code] = false;
    };

    interactionLayer.style.cursor = "grab";
    interactionLayer.addEventListener("mousedown", onMouseDown);
    interactionLayer.addEventListener("touchstart", onTouchStart, { passive: true });
    interactionLayer.addEventListener("touchmove", onTouchMove, { passive: true });
    interactionLayer.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("resize", setCanvasSize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    setCanvasSize();
    animate();

    viewer
      .addSplatScenes([
        {
          path: memory.splatUrl,
          splatAlphaRemovalThreshold: 5,
          // Flip the imported splat upright to match world orientation.
          rotation: [1, 0, 0, 0],
          format: memory.splatUrl.toLowerCase().endsWith(".spz")
            ? (GaussianSplats3D as unknown as { SceneFormat?: { Spz?: number } }).SceneFormat?.Spz
            : undefined,
        },
      ])
      .then(() => {
        if (isDisposed) return;

        const loadedSplatScene = (viewer as unknown as {
          getSceneCount?: () => number;
          getSplatScene?: (sceneIndex: number) => CenterableSplatScene | undefined;
        }).getSceneCount?.()
          ? (viewer as unknown as {
              getSplatScene?: (sceneIndex: number) => CenterableSplatScene | undefined;
            }).getSplatScene?.(0)
          : undefined;

        const sceneCenter = loadedSplatScene?.splatBuffer?.sceneCenter;
        if (loadedSplatScene && sceneCenter) {
          loadedSplatScene.updateMatrix();
          const worldCenter = sceneCenter.clone().applyMatrix4(loadedSplatScene.matrix);
          camera.position.set(worldCenter.x, worldCenter.y + CAMERA_EYE_HEIGHT, worldCenter.z + CAMERA_START_DISTANCE);
          targetYaw = 0;
          targetPitch = 0;
          yaw = 0;
          pitch = 0;
          camera.lookAt(worldCenter.x, worldCenter.y + CAMERA_EYE_HEIGHT, worldCenter.z);
        }

        setLoaded(true);
      })
      .catch((error: unknown) => {
        if (isDisposed) return;
        const message = error instanceof Error ? error.message : "This memory has not been rendered yet";
        setLoadError(message || "This memory has not been rendered yet");
      });

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(animationFrameRef.current);

      interactionLayer.removeEventListener("mousedown", onMouseDown);
      interactionLayer.removeEventListener("touchstart", onTouchStart);
      interactionLayer.removeEventListener("touchmove", onTouchMove);
      interactionLayer.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

      if (viewerRef.current && "dispose" in viewerRef.current && typeof viewerRef.current.dispose === "function") {
        viewerRef.current.dispose();
      }
      viewerRef.current = null;

      disposeScene(scene);
      scene.clear();
      sceneRef.current = null;
      cameraRef.current = null;

      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
    };
  }, [memory.splatUrl]);

  const handleBackToLobby = () => {
    setIsLeaving(true);
    queueFadeTimer(() => {
      router.push("/lobby");
    }, 500);
  };

  const showMemoryPending = Boolean(loadError) || !hasRenderableSplat;
  const showLoadOverlay = !loaded && !showMemoryPending;
  const overlayVisible = isLeaving || showLoadOverlay;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0d0a1e]">
      <div ref={containerRef} className="h-full w-full" />
      <div ref={interactionLayerRef} className="absolute inset-0 z-10 touch-none" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-7">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBackToLobby}
            className="pointer-events-auto flex h-9 items-center justify-center rounded-full border border-purple-300/25 px-4 text-purple-300/60 transition-colors hover:border-purple-300/60 hover:text-purple-100"
          >
            ←
          </button>
          <div className="text-[20px] uppercase tracking-[0.25em] text-purple-100/90">
            Memoir
            <span className="mt-1 block text-[11px] italic tracking-[0.4em] text-purple-300/75">Memory Palace</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[18px] text-purple-100/90">{memory.title}</div>
          <div className="mt-1 text-[12px] tracking-[0.2em] text-purple-300/50">{year ?? "MEMORY"}</div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-7 z-20 flex justify-center">
        <div className="text-[12px] italic tracking-[0.2em] text-purple-300/40">Drag to look around · WASD to walk</div>
      </div>

      {!loaded && !showMemoryPending ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0d0a1e]">
          <div className="h-20 w-20 animate-pulse rounded-full bg-purple-400/30" />
          <div className="mt-6 text-[12px] italic tracking-[0.35em] text-purple-300/60">Entering memory...</div>
        </div>
      ) : null}

      {showMemoryPending ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0d0a1e] px-6">
          <div className="max-w-lg rounded-[2rem] border border-purple-300/15 bg-white/[0.03] p-8 text-center text-purple-100 shadow-[0_30px_80px_rgba(0,0,0,0.3)]">
            <p className="text-xs uppercase tracking-[0.35em] text-purple-300/55">Memory Viewer</p>
            <h1 className="mt-4 text-3xl font-semibold">This memory has not been rendered yet</h1>
            <p className="mt-4 text-sm leading-7 text-purple-100/65">
              {loadError && loadError !== "This memory has not been rendered yet"
                ? loadError
                : "A Gaussian splat file is required before this memory can be viewed."}
            </p>
            <button
              type="button"
              onClick={handleBackToLobby}
              className="mt-6 rounded-full border border-purple-300/25 px-5 py-2 text-sm text-purple-200/80 transition-colors hover:border-purple-300/60 hover:text-purple-100"
            >
              Back to lobby
            </button>
          </div>
        </div>
      ) : null}

      {!loaded && !showMemoryPending ? (
        <div className="sr-only" aria-live="polite">
          <Spinner />
        </div>
      ) : null}

      <ConversationPanel sessionId={sessionId} memoryTitle={memory.title} onConversationEnd={handleSessionEnd} />

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-50 bg-black transition-opacity ${overlayVisible ? "opacity-100" : "opacity-0"}`}
        style={{ transitionDuration: `${showLoadOverlay ? 700 : 500}ms` }}
      />
    </div>
  );
}