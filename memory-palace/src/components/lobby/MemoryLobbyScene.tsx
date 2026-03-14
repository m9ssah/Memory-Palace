"use client";

import { Html, OrbitControls, useCursor, useFBX, useProgress, useTexture } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import {
  type Object3D,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  type Texture,
} from "three";
import { Suspense, startTransition, useEffect, useMemo, useState } from "react";
import type { Memory } from "@/types";
import { cn } from "@/lib/utils";

type LobbySceneProps = {
  memories: Memory[];
};

type TextureSet = {
  map?: Texture;
  normalMap?: Texture;
  roughnessMap?: Texture;
  metalnessMap?: Texture;
};

const MODEL_PATH = "/models/lobby/ArtGallery.fbx";

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveTextureKey(...names: string[]): string | null {
  const combined = names.map(normalizeName).join(" ");

  if (combined.includes("ceillingwire")) return "ceillingWire";
  if (combined.includes("benchconcretebase")) return "benchConcreteBase";
  if (combined.includes("benchwood") || combined.includes("woodmaterial0")) return "benchWood";
  if (combined.includes("walls")) return "walls";
  if (combined.includes("floor")) return "floor";
  if (combined.includes("ceilling")) return "ceilling";
  if (combined.includes("lampbase") || combined.includes("lamp")) return "lamp";
  if (combined.includes("canvas") || combined.includes("painting") || combined.includes("paiting")) {
    return "canvas";
  }

  return null;
}

function isInteractiveName(name: string): boolean {
  const normalized = normalizeName(name);
  return normalized.includes("painting") || normalized.includes("paiting") || normalized.includes("canvas");
}

function getMemoryFromObject(object: Object3D, memoriesById: Map<string, Memory>): Memory | undefined {
  let current: Object3D | null = object;

  while (current) {
    const memoryId = current.userData.memoryId;
    if (typeof memoryId === "string") {
      return memoriesById.get(memoryId);
    }
    current = current.parent;
  }

  return undefined;
}

function configureColorTexture(texture?: Texture) {
  if (!texture) return;
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
}

function configureDataTexture(texture?: Texture) {
  if (!texture) return;
  texture.flipY = false;
}

function LoadingOverlay() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-stone-100 shadow-2xl backdrop-blur-sm">
        Loading lobby model {Math.round(progress)}%
      </div>
    </Html>
  );
}

type GalleryModelProps = {
  memories: Memory[];
  hoveredMemoryId: string | null;
  onHoverMemory(memoryId: string | null): void;
  onSelectMemory(memory: Memory): void;
};

function GalleryModel({ memories, hoveredMemoryId, onHoverMemory, onSelectMemory }: GalleryModelProps) {
  const router = useRouter();
  const baseModel = useFBX(MODEL_PATH);
  const memoriesById = useMemo(() => new Map(memories.map((memory) => [memory.id, memory])), [memories]);
  const textures = useTexture({
    wallsBase: "/textures/lobby/Walls_BaseColor_Lightmapped.png",
    wallsNormal: "/textures/lobby/Walls_Normal.png",
    wallsRoughness: "/textures/lobby/Walls_Roughness.png",
    floorBase: "/textures/lobby/Floor_BaseColor_Lightmapped.png",
    floorNormal: "/textures/lobby/Floor_Normal.png",
    floorRoughness: "/textures/lobby/Floor_Roughness.png",
    ceillingBase: "/textures/lobby/Ceilling_BaseColor_Lightmapped.png",
    ceillingNormal: "/textures/lobby/Ceilling_Normal.png",
    ceillingRoughness: "/textures/lobby/Ceilling_Roughness.png",
    ceillingWireBase: "/textures/lobby/CeillingWire_BaseColor.png",
    ceillingWireNormal: "/textures/lobby/CeillingWire_Normal.png",
    ceillingWireRoughness: "/textures/lobby/CeillingWire_Roughness.png",
    canvasBase: "/textures/lobby/Canvas_BaseColor.png",
    lampBase: "/textures/lobby/Lamp_BaseColor.png",
    lampNormal: "/textures/lobby/Lamp_Normal.png",
    lampRoughness: "/textures/lobby/Lamp_Roughness.png",
    lampMetalness: "/textures/lobby/Lamp_Metallic.png",
    benchWoodBase: "/textures/lobby/BenchWood_BaseColor_Lightmapped.png",
    benchWoodNormal: "/textures/lobby/BenchWood_Normal.png",
    benchWoodRoughness: "/textures/lobby/BenchWood_Roughness.png",
    benchConcreteBase: "/textures/lobby/BenchConcreteBase_BaseColor_Lightmapped.png",
    benchConcreteNormal: "/textures/lobby/BenchConcreteBase_Normal.png",
    benchConcreteRoughness: "/textures/lobby/BenchConcreteBase_Roughness.png",
  });

  const textureRegistry = useMemo<Record<string, TextureSet>>(
    () => ({
      walls: {
        map: textures.wallsBase,
        normalMap: textures.wallsNormal,
        roughnessMap: textures.wallsRoughness,
      },
      floor: {
        map: textures.floorBase,
        normalMap: textures.floorNormal,
        roughnessMap: textures.floorRoughness,
      },
      ceilling: {
        map: textures.ceillingBase,
        normalMap: textures.ceillingNormal,
        roughnessMap: textures.ceillingRoughness,
      },
      ceillingWire: {
        map: textures.ceillingWireBase,
        normalMap: textures.ceillingWireNormal,
        roughnessMap: textures.ceillingWireRoughness,
      },
      canvas: {
        map: textures.canvasBase,
      },
      lamp: {
        map: textures.lampBase,
        normalMap: textures.lampNormal,
        roughnessMap: textures.lampRoughness,
        metalnessMap: textures.lampMetalness,
      },
      benchWood: {
        map: textures.benchWoodBase,
        normalMap: textures.benchWoodNormal,
        roughnessMap: textures.benchWoodRoughness,
      },
      benchConcreteBase: {
        map: textures.benchConcreteBase,
        normalMap: textures.benchConcreteNormal,
        roughnessMap: textures.benchConcreteRoughness,
      },
    }),
    [textures],
  );

  useMemo(() => {
    configureColorTexture(textures.wallsBase);
    configureDataTexture(textures.wallsNormal);
    configureDataTexture(textures.wallsRoughness);
    configureColorTexture(textures.floorBase);
    configureDataTexture(textures.floorNormal);
    configureDataTexture(textures.floorRoughness);
    configureColorTexture(textures.ceillingBase);
    configureDataTexture(textures.ceillingNormal);
    configureDataTexture(textures.ceillingRoughness);
    configureColorTexture(textures.ceillingWireBase);
    configureDataTexture(textures.ceillingWireNormal);
    configureDataTexture(textures.ceillingWireRoughness);
    configureColorTexture(textures.canvasBase);
    configureColorTexture(textures.lampBase);
    configureDataTexture(textures.lampNormal);
    configureDataTexture(textures.lampRoughness);
    configureDataTexture(textures.lampMetalness);
    configureColorTexture(textures.benchWoodBase);
    configureDataTexture(textures.benchWoodNormal);
    configureDataTexture(textures.benchWoodRoughness);
    configureColorTexture(textures.benchConcreteBase);
    configureDataTexture(textures.benchConcreteNormal);
    configureDataTexture(textures.benchConcreteRoughness);
  }, [textures]);

  const scene = useMemo(() => {
    const clonedScene = baseModel.clone(true);
    const interactiveMeshes: Mesh[] = [];

    clonedScene.traverse((child) => {
      if (!(child instanceof Mesh)) return;

      child.castShadow = true;
      child.receiveShadow = true;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;

        const textureKey = resolveTextureKey(material.name, child.name);
        const textureSet = textureKey ? textureRegistry[textureKey] : null;

        if (textureSet) {
          material.map = textureSet.map ?? null;
          material.normalMap = textureSet.normalMap ?? null;
          material.roughnessMap = textureSet.roughnessMap ?? null;
          material.metalnessMap = textureSet.metalnessMap ?? null;
          material.metalness = textureSet.metalnessMap ? 0.9 : material.metalness;
          material.roughness = textureSet.roughnessMap ? 1 : material.roughness;
          material.needsUpdate = true;
        }

        material.userData.baseEmissiveIntensity = material.emissiveIntensity;
      }

      if (isInteractiveName(child.name)) {
        interactiveMeshes.push(child);
      }
    });

    interactiveMeshes.sort((left, right) => left.name.localeCompare(right.name));

    interactiveMeshes.forEach((mesh, index) => {
      const memory = memories[index];
      if (!memory) return;

      mesh.userData.memoryId = memory.id;
      mesh.userData.interactive = true;
    });

    return clonedScene;
  }, [baseModel, memories, textureRegistry]);

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof Mesh) || !child.userData.interactive) return;

      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!(material instanceof MeshStandardMaterial)) continue;

        const isHovered = child.userData.memoryId === hoveredMemoryId;
        material.emissive.set(isHovered ? "#a16207" : "#000000");
        material.emissiveIntensity = isHovered ? 0.45 : (material.userData.baseEmissiveIntensity as number) ?? 0;
      }
    });
  }, [hoveredMemoryId, scene]);

  const hoveredMemory = hoveredMemoryId ? memoriesById.get(hoveredMemoryId) : undefined;
  useCursor(Boolean(hoveredMemory), "pointer", "auto");

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    const memory = getMemoryFromObject(event.object, memoriesById);
    onHoverMemory(memory?.id ?? null);
  }

  function handleClick(event: ThreeEvent<MouseEvent>) {
    const memory = getMemoryFromObject(event.object, memoriesById);
    if (!memory) return;

    event.stopPropagation();
    onSelectMemory(memory);

    startTransition(() => {
      router.push(`/viewer/${memory.id}`);
    });
  }

  return (
    <primitive
      object={scene}
      position={[0, -1.4, 0]}
      rotation={[0, Math.PI, 0]}
      onPointerMove={handlePointerMove}
      onPointerOut={() => onHoverMemory(null)}
      onClick={handleClick}
    />
  );
}

export default function MemoryLobbyScene({ memories }: LobbySceneProps) {
  const [hoveredMemoryId, setHoveredMemoryId] = useState<string | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);

  const activeMemory = useMemo(() => {
    const hovered = memories.find((memory) => memory.id === hoveredMemoryId);
    if (hovered) return hovered;
    return memories.find((memory) => memory.id === selectedMemoryId) ?? memories[0];
  }, [hoveredMemoryId, memories, selectedMemoryId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-stone-950 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-black/70 via-black/40 to-black/10 px-5 py-4 text-sm text-stone-100 backdrop-blur-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Immersive Lobby</p>
            <p className="mt-1 text-stone-300">Click a framed canvas to open its generated memory world.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-200">
            {memories.length} memory{memories.length === 1 ? "" : "ies"} linked
          </div>
        </div>

        <div className="h-[70vh] min-h-[34rem] w-full bg-[radial-gradient(circle_at_top,#3f2c1d_0%,#120f0c_40%,#080808_100%)]">
          <Canvas shadows camera={{ position: [0, 2.6, 9.5], fov: 40 }}>
            <color attach="background" args={["#090909"]} />
            <fog attach="fog" args={["#090909", 10, 30]} />
            <ambientLight intensity={1.65} />
            <directionalLight
              castShadow
              intensity={2.2}
              position={[8, 12, 6]}
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <spotLight intensity={55} angle={0.38} penumbra={0.7} position={[0, 7, 0]} color="#fbbf24" />

            <Suspense fallback={<LoadingOverlay />}>
              <GalleryModel
                memories={memories}
                hoveredMemoryId={hoveredMemoryId}
                onHoverMemory={setHoveredMemoryId}
                onSelectMemory={(memory) => setSelectedMemoryId(memory.id)}
              />
            </Suspense>

            <OrbitControls
              enablePan={false}
              target={[0, 1.35, 0]}
              minDistance={5}
              maxDistance={13}
              minPolarAngle={0.8}
              maxPolarAngle={1.5}
            />
          </Canvas>
        </div>
      </div>

      <aside className="flex flex-col gap-4 rounded-[2rem] border border-stone-200/10 bg-white/[0.03] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.2)] backdrop-blur-md">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">Active Canvas</p>
          <h2 className="mt-3 text-2xl font-semibold text-stone-50">
            {activeMemory?.title ?? "No linked memories yet"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-300">
            {activeMemory?.description ??
              (memories.length
                ? "This memory is ready to open in the viewer from the gallery canvas."
                : "Upload a memory and generate its world to assign it to a lobby canvas.")}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-stone-200">
          <p className="font-medium text-stone-50">Interaction</p>
          <p className="mt-2 leading-6 text-stone-300">
            Hover over a painting to highlight it. Click the canvas to transition into the selected Gaussian splat world.
          </p>
        </div>

        <div className="grid gap-3">
          {memories.map((memory) => {
            const isActive = memory.id === activeMemory?.id;

            return (
              <div
                key={memory.id}
                className={cn(
                  "rounded-2xl border px-4 py-3 transition-colors",
                  isActive
                    ? "border-amber-400/50 bg-amber-300/10 text-stone-50"
                    : "border-white/10 bg-white/[0.02] text-stone-300",
                )}
              >
                <p className="font-medium">{memory.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-stone-400">
                  {memory.marbleUrl ? "Viewer ready" : "Waiting for generated world"}
                </p>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

useFBX.preload(MODEL_PATH);