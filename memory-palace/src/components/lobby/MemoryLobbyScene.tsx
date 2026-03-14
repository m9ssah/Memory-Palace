"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import type { Memory } from "@/types";

type LobbySceneProps = {
  memories: Memory[];
};

type LobbyMemory = {
  id: string;
  title: string;
  year: string;
  hue: string;
  light: number;
};

const DOOR_SLOTS = [
  { pos: [0, -5.88] as const, ry: 0 },
  { pos: [5.88, 0] as const, ry: -Math.PI / 2 },
  { pos: [0, 5.88] as const, ry: Math.PI },
  { pos: [-5.88, 0] as const, ry: Math.PI / 2 },
];

const FALLBACK_MEMORIES: LobbyMemory[] = [
  { id: "memory-1", title: "Grandma's Kitchen", year: "Summer 1974", hue: "#C47840", light: 0xC47840 },
  { id: "memory-2", title: "Birthday at the Lake", year: "August 1982", hue: "#5E8EA8", light: 0x5E8EA8 },
  { id: "memory-3", title: "The Old Garden", year: "Spring 1969", hue: "#6A9A6A", light: 0x6A9A6A },
  { id: "memory-4", title: "Christmas Morning", year: "December 1978", hue: "#A86070", light: 0xA86070 },
];

function labelYear(dateText?: string): string {
  if (!dateText) return "Memory";
  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return "Memory";
  return String(parsed.getFullYear());
}

function makeDoorLabel(memory: LobbyMemory) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  ctx.fillStyle = memory.hue;
  ctx.fillRect(0, 0, 512, 768);

  const dark = ctx.createLinearGradient(0, 0, 0, 768);
  dark.addColorStop(0, "rgba(0,0,0,0.5)");
  dark.addColorStop(0.4, "rgba(0,0,0,0.25)");
  dark.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, 512, 768);

  const px = 80;
  const py = 80;
  const pw = 352;
  const ph = 350;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(px, py, pw, ph);

  const cx = px + pw / 2;
  const cy = py + ph / 2;
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(cx - 26, cy + 8, 52, 6);

  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 460);
  ctx.lineTo(432, 460);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "bold 52px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = memory.title.split(" ");
  if (words.length > 2 && memory.title.length > 16) {
    const mid = Math.ceil(words.length / 2);
    ctx.fillText(words.slice(0, mid).join(" "), 256, 530);
    ctx.fillText(words.slice(mid).join(" "), 256, 595);
  } else {
    ctx.fillText(memory.title, 256, 560);
  }

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "30px Georgia, serif";
  ctx.fillText(memory.year, 256, 680);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function MemoryLobbyScene({ memories }: LobbySceneProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedMemoryRef = useRef<LobbyMemory | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<LobbyMemory | null>(null);
  const [hoveredMemory, setHoveredMemory] = useState<LobbyMemory | null>(null);
  const [isEntering, setIsEntering] = useState(false);

  const lobbyMemories = useMemo<LobbyMemory[]>(() => {
    if (memories.length === 0) return FALLBACK_MEMORIES;

    const converted = memories.slice(0, 4).map((memory, index) => {
      const fallback = FALLBACK_MEMORIES[index % FALLBACK_MEMORIES.length];
      return {
        id: memory.id,
        title: memory.title,
        year: labelYear(memory.createdAt),
        hue: fallback.hue,
        light: fallback.light,
      };
    });

    if (converted.length < 4) {
      return [...converted, ...FALLBACK_MEMORIES.slice(converted.length, 4)];
    }

    return converted;
  }, [memories]);

  useEffect(() => {
    selectedMemoryRef.current = selectedMemory;
  }, [selectedMemory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a0800);
    scene.fog = new THREE.FogExp2(0x1a0800, 0.06);

    const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 60);
    camera.position.set(0, 1.65, 0);
    camera.rotation.order = "YXZ";

    const roomW = 12;
    const roomH = 4.2;
    const roomD = 12;
    const halfW = roomW / 2;
    const halfD = roomD / 2;

    const standardMat = (color: number, roughness = 0.95, emissive = 0x000000, emissiveIntensity = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD, 8, 8), standardMat(0x4a2e12, 0.97));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    for (let i = -5; i <= 5; i += 1) {
      const plank = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14, roomD),
        new THREE.MeshStandardMaterial({ color: 0x5c3818, roughness: 1 }),
      );
      plank.rotation.x = -Math.PI / 2;
      plank.position.set(i * 1.1, 0.001, 0);
      scene.add(plank);
    }

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), standardMat(0x2a1a0a, 0.9));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomH;
    scene.add(ceiling);

    const wallDirs = [
      { pos: [0, roomH / 2, -halfD] as const, ry: 0 },
      { pos: [halfW, roomH / 2, 0] as const, ry: -Math.PI / 2 },
      { pos: [0, roomH / 2, halfD] as const, ry: Math.PI },
      { pos: [-halfW, roomH / 2, 0] as const, ry: Math.PI / 2 },
    ];

    for (const wallDef of wallDirs) {
      const wall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), standardMat(0xc2a07a, 0.95));
      wall.position.set(wallDef.pos[0], wallDef.pos[1], wallDef.pos[2]);
      wall.rotation.y = wallDef.ry;
      wall.receiveShadow = true;
      scene.add(wall);
    }

    const trimMaterial = standardMat(0x5c3818, 0.85);
    for (const wallDef of wallDirs) {
      const base = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.18, 0.06), trimMaterial);
      base.position.set(wallDef.pos[0], 0.09, wallDef.pos[2]);
      base.rotation.y = wallDef.ry;
      scene.add(base);

      const crown = new THREE.Mesh(new THREE.BoxGeometry(roomW, 0.12, 0.07), trimMaterial);
      crown.position.set(wallDef.pos[0], roomH - 0.06, wallDef.pos[2]);
      crown.rotation.y = wallDef.ry;
      scene.add(crown);
    }

    const rugBorder = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), standardMat(0xc4a24a, 0.98));
    rugBorder.rotation.x = -Math.PI / 2;
    rugBorder.position.set(0, 0.001, 0);
    scene.add(rugBorder);

    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), standardMat(0x7a2a2a, 0.99));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.002, 0);
    scene.add(rug);

    const diamond = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), standardMat(0x9a3a3a, 0.99));
    diamond.rotation.x = -Math.PI / 2;
    diamond.rotation.z = Math.PI / 4;
    diamond.position.set(0, 0.003, 0);
    scene.add(diamond);

    scene.add(new THREE.AmbientLight(0xffd4a0, 0.25));
    scene.add(new THREE.HemisphereLight(0xffcc88, 0x220d00, 0.3));

    const pendantLight = new THREE.PointLight(0xffe4a0, 2, 14);
    pendantLight.position.set(0, roomH - 0.35, 0);
    pendantLight.castShadow = true;
    pendantLight.shadow.mapSize.set(512, 512);
    scene.add(pendantLight);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.22, 0.28, 10),
      new THREE.MeshStandardMaterial({
        color: 0x8b6914,
        emissive: 0xffcc44,
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    lampShade.position.set(0, roomH - 0.5, 0);
    scene.add(lampShade);

    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a }),
    );
    cord.position.set(0, roomH - 0.18, 0);
    scene.add(cord);

    const doorLights = lobbyMemories.map((memory, index) => {
      const slot = DOOR_SLOTS[index];
      const light = new THREE.PointLight(memory.light, 0.5, 6);
      light.position.set(slot.pos[0] * 0.65, 1.8, slot.pos[1] * 0.65);
      scene.add(light);
      return light;
    });

    const doorMeshes: Array<
      THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial> & {
        userData: {
          memory: LobbyMemory;
          doorLightIndex: number;
          glowMat: THREE.MeshBasicMaterial;
          transomMat: THREE.MeshBasicMaterial;
        };
      }
    > = [];

    const doorWidth = 2;
    const doorHeight = 3.2;
    const frameThickness = 0.13;

    lobbyMemories.forEach((memory, index) => {
      const slot = DOOR_SLOTS[index];
      const group = new THREE.Group();
      group.position.set(slot.pos[0], 0, slot.pos[1]);
      group.rotation.y = slot.ry;

      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x7a5620,
        roughness: 0.55,
        metalness: 0.05,
        emissive: 0x3d1a00,
        emissiveIntensity: 0.15,
      });

      const frameParts = [
        { geo: new THREE.BoxGeometry(frameThickness, doorHeight + frameThickness * 2, 0.16), pos: [-(doorWidth / 2 + frameThickness / 2), doorHeight / 2, 0] as const },
        { geo: new THREE.BoxGeometry(frameThickness, doorHeight + frameThickness * 2, 0.16), pos: [doorWidth / 2 + frameThickness / 2, doorHeight / 2, 0] as const },
        { geo: new THREE.BoxGeometry(doorWidth + frameThickness * 2, frameThickness, 0.16), pos: [0, doorHeight + frameThickness / 2, 0] as const },
        { geo: new THREE.BoxGeometry(doorWidth + frameThickness * 2, 0.06, 0.2), pos: [0, 0.03, 0] as const },
      ];

      for (const part of frameParts) {
        const mesh = new THREE.Mesh(part.geo, frameMat);
        mesh.position.set(...part.pos);
        mesh.castShadow = true;
        group.add(mesh);
      }

      const panelMat = new THREE.MeshStandardMaterial({
        map: makeDoorLabel(memory),
        roughness: 0.85,
        metalness: 0,
        emissive: new THREE.Color(memory.hue),
        emissiveIntensity: 0.06,
      });

      const panel = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth, doorHeight), panelMat) as typeof doorMeshes[number];
      panel.position.set(0, doorHeight / 2, 0.02);

      const transomMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(memory.hue),
        transparent: true,
        opacity: 0.18,
      });
      const transom = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth, 0.45), transomMat);
      transom.position.set(0, doorHeight + frameThickness + 0.225, 0.02);
      group.add(transom);

      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(memory.hue),
        transparent: true,
        opacity: 0,
      });
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth * 2.4, doorHeight * 1.8), glowMat);
      glow.position.set(0, doorHeight / 2, -0.03);
      group.add(glow);

      panel.userData = {
        memory,
        doorLightIndex: index,
        glowMat,
        transomMat,
      };

      group.add(panel);
      doorMeshes.push(panel);

      const knobMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.2, metalness: 0.85 });
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), knobMat);
      knob.position.set(0.72, doorHeight / 2, 0.12);
      group.add(knob);

      const escutcheon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.09), knobMat);
      escutcheon.position.set(0.73, doorHeight / 2, 0.1);
      group.add(escutcheon);

      scene.add(group);
    });

    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.05, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x6b3a1a, roughness: 0.7, metalness: 0.05 }),
    );
    tableTop.position.set(4, 0.78, 4);
    tableTop.castShadow = true;
    scene.add(tableTop);

    [
      [4.5, 0, 4.15],
      [3.5, 0, 4.15],
      [4.5, 0, 3.85],
      [3.5, 0, 3.85],
    ].forEach((legPos) => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.76, 0.06),
        new THREE.MeshStandardMaterial({ color: 0x5c3010, roughness: 0.8 }),
      );
      leg.position.set(legPos[0], 0.38, legPos[2]);
      scene.add(leg);
    });

    const vase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.1, 0.28, 10),
      new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.3, metalness: 0.1 }),
    );
    vase.position.set(4.1, 0.95, 4);
    scene.add(vase);

    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.09, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.4, metalness: 0.6 }),
    );
    lampBase.position.set(3.8, 0.93, 4);
    scene.add(lampBase);

    const tableLampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.18, 0.22, 8),
      new THREE.MeshStandardMaterial({
        color: 0xf5e0b0,
        roughness: 0.9,
        emissive: 0xffcc44,
        emissiveIntensity: 0.4,
        side: THREE.DoubleSide,
      }),
    );
    tableLampShade.position.set(3.8, 1.22, 4);
    scene.add(tableLampShade);

    const tableLight = new THREE.PointLight(0xffe0a0, 0.6, 4);
    tableLight.position.set(3.8, 1.3, 4);
    scene.add(tableLight);

    const dustCount = 80;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities: Array<{ vx: number; vy: number; vz: number }> = [];
    for (let i = 0; i < dustCount; i += 1) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 10;
      dustPositions[i * 3 + 1] = Math.random() * (roomH - 0.3);
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      dustVelocities.push({
        vx: (Math.random() - 0.5) * 0.0008,
        vy: 0.0006 + Math.random() * 0.0008,
        vz: (Math.random() - 0.5) * 0.0008,
      });
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    const dustMesh = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ color: 0xffe8c0, size: 0.018, transparent: true, opacity: 0.35 }),
    );
    scene.add(dustMesh);

    const raycaster = new THREE.Raycaster();
    const mouse2D = new THREE.Vector2();

    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let yaw = 0;
    let pitch = 0;
    let clock = 0;
    let hoveredDoor: typeof doorMeshes[number] | null = null;

    const setCanvasSize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const updateMouse = (clientX: number, clientY: number) => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      mouse2D.x = (clientX / width) * 2 - 1;
      mouse2D.y = -(clientY / height) * 2 + 1;
      raycaster.setFromCamera(mouse2D, camera);
      const hits = raycaster.intersectObjects(doorMeshes);
      const nextHovered = hits.length > 0 ? (hits[0].object as typeof doorMeshes[number]) : null;

      if (hoveredDoor === nextHovered) return;

      if (hoveredDoor) {
        hoveredDoor.material.emissiveIntensity = 0.06;
        hoveredDoor.userData.glowMat.opacity = 0;
        hoveredDoor.userData.transomMat.opacity = 0.18;
        doorLights[hoveredDoor.userData.doorLightIndex].intensity = 0.5;
      }

      hoveredDoor = nextHovered;

      if (hoveredDoor) {
        hoveredDoor.material.emissiveIntensity = 0.3;
        hoveredDoor.userData.glowMat.opacity = 0.14;
        hoveredDoor.userData.transomMat.opacity = 0.35;
        doorLights[hoveredDoor.userData.doorLightIndex].intensity = 1.8;
        canvas.style.cursor = "pointer";
        setHoveredMemory(hoveredDoor.userData.memory);
      } else {
        canvas.style.cursor = isDragging ? "grabbing" : "grab";
        setHoveredMemory(null);
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMouseX = event.clientX;
      previousMouseY = event.clientY;
      canvas.style.cursor = "grabbing";
    };

    const onMouseUp = () => {
      isDragging = false;
      canvas.style.cursor = hoveredDoor ? "pointer" : "grab";
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        targetYaw -= (event.clientX - previousMouseX) * 0.0035;
        targetPitch -= (event.clientY - previousMouseY) * 0.0025;
        targetPitch = Math.max(-0.48, Math.min(0.48, targetPitch));
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
      }
      updateMouse(event.clientX, event.clientY);
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      isDragging = true;
      previousMouseX = touch.clientX;
      previousMouseY = touch.clientY;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      targetYaw -= (touch.clientX - previousMouseX) * 0.004;
      targetPitch -= (touch.clientY - previousMouseY) * 0.003;
      targetPitch = Math.max(-0.48, Math.min(0.48, targetPitch));
      previousMouseX = touch.clientX;
      previousMouseY = touch.clientY;
      updateMouse(touch.clientX, touch.clientY);
    };

    const onCanvasClick = () => {
      if (!hoveredDoor || selectedMemoryRef.current) return;
      setSelectedMemory(hoveredDoor.userData.memory);
    };

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      clock += 0.012;

      yaw += (targetYaw - yaw) * 0.09;
      pitch += (targetPitch - pitch) * 0.09;
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      pendantLight.intensity = 2 + Math.sin(clock * 0.6) * 0.08 + Math.sin(clock * 2.1) * 0.04;
      tableLight.intensity = 0.6 + Math.sin(clock * 1.4) * 0.05;

      const positions = dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < dustCount; i += 1) {
        positions[i * 3] += dustVelocities[i].vx;
        positions[i * 3 + 1] += dustVelocities[i].vy;
        positions[i * 3 + 2] += dustVelocities[i].vz;

        if (positions[i * 3 + 1] > roomH - 0.1) {
          positions[i * 3 + 1] = 0.05;
        }
        if (Math.abs(positions[i * 3]) > 5.8) {
          dustVelocities[i].vx *= -1;
        }
        if (Math.abs(positions[i * 3 + 2]) > 5.8) {
          dustVelocities[i].vz *= -1;
        }
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    setCanvasSize();
    animate();

    canvas.style.cursor = "grab";
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    canvas.addEventListener("click", onCanvasClick);

    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", setCanvasSize);

    return () => {
      window.cancelAnimationFrame(frameId);

      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("click", onCanvasClick);

      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", setCanvasSize);

      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;

        const geometry = object.geometry;
        geometry?.dispose();

        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!material) return;
          Object.values(material).forEach((value) => {
            if (value instanceof THREE.Texture) {
              value.dispose();
            }
          });
          material.dispose();
        });
      });

      renderer.dispose();
    };
  }, [lobbyMemories]);

  const tooltipText = hoveredMemory ? `"${hoveredMemory.title}" - click to enter` : "Select a memory to begin";

  return (
    <div className="relative h-[78vh] min-h-[38rem] w-full overflow-hidden rounded-[2rem] border border-amber-200/10 bg-[#1a0800]">
      <canvas ref={canvasRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-7">
        <div className="text-[20px] uppercase tracking-[0.25em] text-amber-100/90">
          Memoir
          <span className="mt-1 block text-[11px] italic tracking-[0.4em] text-amber-300/45">Memory Palace</span>
        </div>
        <div className="text-right text-[12px] italic tracking-[0.2em] text-amber-300/45">
          Drag to look around
          <br />
          Click a door to enter
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-7 flex justify-center">
        <div className="text-[12px] italic tracking-[0.2em] text-amber-200/70">{tooltipText}</div>
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center transition-colors duration-500 ${selectedMemory ? "pointer-events-auto bg-black/65" : "pointer-events-none bg-transparent"}`}
        onClick={(event) => {
          if (event.target === event.currentTarget && !isEntering) {
            setSelectedMemory(null);
          }
        }}
      >
        <div
          className={`w-[90%] max-w-[360px] rounded-[14px] border border-amber-200/20 bg-[rgba(20,10,3,0.94)] px-11 py-9 text-center text-amber-100 backdrop-blur-md transition-all duration-300 ${selectedMemory ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-90 opacity-0"}`}
        >
          <div className="mb-3 text-[10px] uppercase tracking-[0.35em] text-amber-300/45">Memory</div>
          <div className="text-[26px] font-bold">{selectedMemory?.title ?? ""}</div>
          <div className="mb-7 mt-1 text-[13px] tracking-[0.15em] text-amber-200/55">{selectedMemory?.year ?? ""}</div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              disabled={!selectedMemory || isEntering}
              onClick={() => {
                if (!selectedMemory) return;
                setIsEntering(true);
                window.setTimeout(() => {
                  router.push(`/viewer/${selectedMemory.id}`);
                }, 400);
              }}
              className="rounded-md border border-amber-300/50 bg-amber-700/25 px-6 py-2.5 text-[14px] tracking-[0.05em] text-amber-100 transition-colors hover:bg-amber-700/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enter Memory
            </button>
            <button
              type="button"
              disabled={isEntering}
              onClick={() => setSelectedMemory(null)}
              className="rounded-md border border-white/15 px-6 py-2.5 text-[14px] tracking-[0.05em] text-white/45 transition-colors hover:border-white/30 hover:text-white/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>

          {isEntering ? <div className="mt-3 text-[13px] text-amber-300/45">Loading your world...</div> : null}
        </div>
      </div>
    </div>
  );
}
