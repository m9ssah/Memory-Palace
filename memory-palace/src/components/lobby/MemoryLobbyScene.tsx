"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
  { id: "memory-1", title: "Grandma's Kitchen", year: "Summer 1974", hue: "#7A43FC", light: 0x7A43FC },
  { id: "memory-2", title: "Birthday at the Lake", year: "August 1982", hue: "#9B6BFF", light: 0x9B6BFF },
  { id: "memory-3", title: "The Old Garden", year: "Spring 1969", hue: "#5E2EB8", light: 0x5E2EB8 },
  { id: "memory-4", title: "Christmas Morning", year: "December 1978", hue: "#B48AFF", light: 0xB48AFF },
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

  ctx.fillStyle = "#1A1234";
  ctx.fillRect(0, 0, 512, 768);

  const wash = ctx.createLinearGradient(0, 0, 0, 768);
  wash.addColorStop(0, `${memory.hue}40`);
  wash.addColorStop(0.5, `${memory.hue}18`);
  wash.addColorStop(1, "#00000055");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 512, 768);

  const px = 72;
  const py = 70;
  const pw = 368;
  const ph = 360;
  ctx.strokeStyle = "rgba(180,150,255,0.2)";
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = "rgba(90,60,160,0.1)";
  ctx.fillRect(px, py, pw, ph);

  const cx = px + pw / 2;
  const cy = py + ph / 2;
  ctx.fillStyle = "rgba(180,150,255,0.16)";
  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(180,150,255,0.42)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(180,150,255,0.42)";
  ctx.beginPath();
  ctx.arc(cx, cy - 14, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(180,150,255,0.26)";
  ctx.fillRect(cx - 26, cy + 8, 52, 6);

  const accent = ctx.createLinearGradient(72, 0, 440, 0);
  accent.addColorStop(0, "rgba(180,150,255,0)");
  accent.addColorStop(0.5, "rgba(180,150,255,0.28)");
  accent.addColorStop(1, "rgba(180,150,255,0)");
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(72, 460);
  ctx.lineTo(440, 460);
  ctx.stroke();

  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "rgba(245,236,255,1)";
  ctx.font = "bold 50px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = memory.title.split(" ");
  if (words.length > 2 && memory.title.length > 16) {
    const mid = Math.ceil(words.length / 2);
    ctx.fillText(words.slice(0, mid).join(" "), 256, 528);
    ctx.fillText(words.slice(mid).join(" "), 256, 592);
  } else {
    ctx.fillText(memory.title, 256, 558);
  }

  ctx.fillStyle = "rgba(210,185,255,0.82)";
  ctx.font = "28px Georgia, serif";
  ctx.fillText(memory.year, 256, 678);
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function MemoryLobbyScene({ memories }: LobbySceneProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectedMemoryRef = useRef<LobbyMemory | null>(null);
  const fadeTimersRef = useRef<number[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<LobbyMemory | null>(null);
  const [hoveredMemory, setHoveredMemory] = useState<LobbyMemory | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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
    return () => {
      fadeTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      fadeTimersRef.current = [];
    };
  }, []);

  const triggerFade = (callback: () => void, durationMs = 600) => {
    setIsMounted(true);
    window.requestAnimationFrame(() => setIsFading(true));
    const timerId = window.setTimeout(() => {
      fadeTimersRef.current = fadeTimersRef.current.filter((id) => id !== timerId);
      callback();
    }, durationMs);
    fadeTimersRef.current.push(timerId);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMappingExposure = 1.5;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1A0F2E);
    scene.fog = new THREE.FogExp2(0x180D2A, 0.035);

    const camera = new THREE.PerspectiveCamera(72, 1, 0.05, 60);
    camera.position.set(0, 1.65, 0);
    camera.rotation.order = "YXZ";

    const roomW = 12;
    const roomH = 4.2;
    const roomD = 12;
    const halfW = roomW / 2;
    const halfD = roomD / 2;

    const standardMat = (color: number, roughness = 0.82, emissive = 0x000000, emissiveIntensity = 0) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, emissive, emissiveIntensity });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(roomW, roomD, 8, 8),
      standardMat(0x1A1434, 0.86, 0x090512, 0.06),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    for (let i = -5; i <= 5; i += 1) {
      const plank = new THREE.Mesh(
        new THREE.PlaneGeometry(0.14, roomD),
        new THREE.MeshStandardMaterial({
          color: 0x261E46,
          roughness: 0.66,
          metalness: 0.02,
          emissive: 0x0B0715,
          emissiveIntensity: 0.04,
        }),
      );
      plank.rotation.x = -Math.PI / 2;
      plank.position.set(i * 1.1, 0.005, 0);
      scene.add(plank);
    }

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomD), standardMat(0x241f3b, 1));
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
      const wall = new THREE.Mesh(
        new THREE.PlaneGeometry(roomW, roomH),
        standardMat(0x76679e, 0.72, 0x1A0D34, .25),
      );
      wall.position.set(wallDef.pos[0], wallDef.pos[1], wallDef.pos[2]);
      wall.rotation.y = wallDef.ry;
      wall.receiveShadow = true;
      scene.add(wall);
    }

    for (const wallDef of wallDirs) {
      for (let panelIndex = -1; panelIndex <= 1; panelIndex += 1) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 1.0, 0.04),
          standardMat(0x45336F, 0.62, 0x120922, 0.05),
        );
        const offsetX = wallDef.ry === 0 || wallDef.ry === Math.PI ? panelIndex * 3.4 : 0;
        const offsetZ = Math.abs(wallDef.ry) === Math.PI / 2 ? panelIndex * 3.4 : 0;
        panel.position.set(wallDef.pos[0] + offsetX, 0.62, wallDef.pos[2] + offsetZ);
        panel.rotation.y = wallDef.ry;
        scene.add(panel);
      }
    }

    const trimMaterial = standardMat(0x4a3d6b, 0.45, 0x382757, 0.08);
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

    const rugBorder = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 4.8),
      standardMat(0x6C1F66, .97 , 0x2D082A, 0.07),
    );
    rugBorder.rotation.x = -Math.PI / 2;
    rugBorder.position.set(0, 0.010, 0);
    scene.add(rugBorder);

    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(4.3, 4.3),
      standardMat(0x4F124D, 0.74, 0x26051E, 0.08),
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.018, 0);
    scene.add(rug);

    const diamond = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.MeshStandardMaterial({
        color: 0xF1D6FF,
        roughness: 0.65,
        metalness: 0,
        emissive: 0xA060CC,
        emissiveIntensity: 0.28,
      }),
    );
    diamond.rotation.x = -Math.PI / 2;
    diamond.rotation.z = Math.PI / 4;
    diamond.position.set(0, 0.026, 0);
    scene.add(diamond);

    scene.add(new THREE.AmbientLight(0x3B2862, 1.05));
    scene.add(new THREE.HemisphereLight(0x705CB2, 0x1A1230, 0.9));

    const pendantLight = new THREE.PointLight(0x7A6FD4, 1.35, 14.5);
    pendantLight.position.set(0, roomH - 0.35, 0);
    pendantLight.castShadow = true;
    pendantLight.shadow.mapSize.set(512, 512);
    scene.add(pendantLight);

    const frontFill = new THREE.PointLight(0xFFD5AA, 1.1, 18);
    frontFill.position.set(0, 2.5, 3.2);
    scene.add(frontFill);

    const rugGlow = new THREE.PointLight(0xA87AE4, 0.7, 6.3);
    rugGlow.position.set(0, 1.2, 0);
    scene.add(rugGlow);

    const centerWarmFill = new THREE.PointLight(0xFFBF8A, 0.58, 10);
    centerWarmFill.position.set(0, 2.0, 0.8);
    scene.add(centerWarmFill);

    const chandelierMaterial = new THREE.MeshStandardMaterial({
      color: 0x24193F,
      roughness: 0.4,
      metalness: 0.82,
    });
    const chandelierBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.13, 0.24, 8),
      chandelierMaterial,
    );
    chandelierBase.position.set(0, roomH - 0.38, 0);
    scene.add(chandelierBase);

    const chandelierCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, 0.38, 6),
      chandelierMaterial,
    );
    chandelierCord.position.set(0, roomH - 0.18, 0);
    scene.add(chandelierCord);

    for (let armIndex = 0; armIndex < 4; armIndex += 1) {
      const angle = armIndex * (Math.PI / 2);
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6),
        chandelierMaterial,
      );
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = angle;
      arm.position.set(Math.cos(angle) * 0.28, roomH - 0.48, Math.sin(angle) * 0.28);
      scene.add(arm);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xA38BE8,
          emissive: 0x7662CC,
          emissiveIntensity: 1,
        }),
      );
      bulb.position.set(Math.cos(angle) * 0.52, roomH - 0.52, Math.sin(angle) * 0.52);
      scene.add(bulb);
    }

    const tableLight = new THREE.PointLight(0xFFB05A, 6.2, 10);
    tableLight.position.set(-4.2, 1.38, -4.0);
    tableLight.castShadow = true;
    scene.add(tableLight);

    const lampFill = new THREE.PointLight(0xFF8A32, 1.33, 4.5);
    lampFill.position.set(-4.4, 0.8, -4.3);
    scene.add(lampFill);

    const windowGlow = new THREE.PointLight(0xDE9CF4, 0.82, 8.2);
    windowGlow.position.set(0, 2.4, -5.5);
    scene.add(windowGlow);

    const doorLights = lobbyMemories.map((memory, index) => {
      const slot = DOOR_SLOTS[index];
      const light = new THREE.PointLight(memory.light, 0.1,);
      light.position.set(slot.pos[0] * 0.66, 1.8, slot.pos[1] * 0.6);
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
        color: 0x241A48,
        roughness: 0.62,
        metalness: 0.08,
        emissive: 0x120830,
        emissiveIntensity: 0.22,
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
        roughness: .85,
        metalness: 0,
        emissive: new THREE.Color(memory.hue),
        emissiveIntensity: 0.16,
      });

      const panel = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth, doorHeight), panelMat) as typeof doorMeshes[number];
      panel.position.set(0, doorHeight / 2, 0.02);

      const transomMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(memory.hue),
        transparent: true,
        opacity: 0.2,
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

      const knobMat = new THREE.MeshStandardMaterial({ color: 0xB090D0, roughness: 0.1184, metalness: 0.95 });
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), knobMat);
      knob.position.set(0.72, doorHeight / 2, 0.12);
      group.add(knob);

      const escutcheon = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.09), knobMat);
      escutcheon.position.set(0.73, doorHeight / 2, 0.1);
      group.add(escutcheon);

      scene.add(group);
    });

    const sideTable = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.74, 0.72),
      new THREE.MeshStandardMaterial({ color: 0x2E214F, roughness: 0.54, emissive: 0x120922, emissiveIntensity: 0.05 }),
    );
    sideTable.position.set(-4.2, 0.37, -4.0);
    scene.add(sideTable);

    const lampBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.12, 0.32, 10),
      new THREE.MeshStandardMaterial({ color: 0x8665BA, roughness: 0.24 }),
    );
    lampBody.position.set(-4.2, 0.9, -4.0);
    scene.add(lampBody);

    const tableLampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.22, 0.27, 10),
      new THREE.MeshStandardMaterial({
        color: 0xF4D9A3,
        roughness: 0.54,
        emissive: 0xFF9040,
        emissiveIntensity: 1.45,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.94,
      }),
    );
    tableLampShade.position.set(-4.2, 1.26, -4.0);
    scene.add(tableLampShade);

    const photoFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.36, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x5B4196, roughness: 0.24, metalness: 0.42 }),
    );
    photoFrame.position.set(-4.2, 0.92, -4.34);
    scene.add(photoFrame);

    const photoInset = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.28),
      new THREE.MeshBasicMaterial({ color: 0x8060A0, transparent: true, opacity: 0.48 }),
    );
    photoInset.position.set(-4.2, 0.92, -4.31);
    scene.add(photoInset);

    const dresser = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.92, 0.56),
      new THREE.MeshStandardMaterial({ color: 0x34255A, roughness: 0.58, emissive: 0x140C24, emissiveIntensity: 0.04 }),
    );
    dresser.position.set(-4.5, 0.46, -4.4);
    scene.add(dresser);

    [0.25, -0.22].forEach((offsetY) => {
      const drawer = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.33, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x46336F, roughness: 0.48, emissive: 0x1A102A, emissiveIntensity: 0.03 }),
      );
      drawer.position.set(-4.5, 0.46 + offsetY, -4.16);
      scene.add(drawer);

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xB090D0, roughness: 0.2, metalness: 0.7 }),
      );
      knob.position.set(-4.5, 0.46 + offsetY, -4.12);
      scene.add(knob);
    });

    const windowFrameMaterial = new THREE.MeshStandardMaterial({ color: 0x2A1D4D, roughness: 0.4, emissive: 0x100818, emissiveIntensity: 0.05 });
    const windowOuter = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.9, 0.09), windowFrameMaterial);
    windowOuter.position.set(0, 2.15, -5.85);
    scene.add(windowOuter);

    const windowPane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 2.45),
      new THREE.MeshBasicMaterial({ color: 0xE8A0FF, transparent: true, opacity: 0.32 }),
    );
    windowPane.position.set(0, 2.15, -5.82);
    scene.add(windowPane);

    [-1.42, 1.42].forEach((x) => {
      const curtain = new THREE.Mesh(
        new THREE.PlaneGeometry(0.92, 3.2),
        new THREE.MeshStandardMaterial({
          color: 0x46306F,
          roughness: 0.82,
          side: THREE.DoubleSide,
          emissive: 0x241040,
          emissiveIntensity: 0.18,
        }),
      );
      curtain.position.set(x, 2.25, -5.78);
      scene.add(curtain);
    });

    const armoire = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 2.95, 0.68),
      new THREE.MeshStandardMaterial({ color: 0x38285E, roughness: 0.54, emissive: 0x140C24, emissiveIntensity: 0.04 }),
    );
    armoire.position.set(4.6, 1.475, -4.5);
    scene.add(armoire);

    [-0.39, 0.39].forEach((offsetX) => {
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 2.52, 0.045),
        new THREE.MeshStandardMaterial({ color: 0x4A3677, roughness: 0.44, emissive: 0x1A102A, emissiveIntensity: 0.04 }),
      );
      door.position.set(4.6 + offsetX, 1.475, -4.18);
      scene.add(door);

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.038, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xC0A0E0, roughness: 0.18, metalness: 0.75 }),
      );
      knob.position.set(4.6 + offsetX * 0.48, 1.475, -4.14);
      scene.add(knob);
    });

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
      new THREE.PointsMaterial({ color: 0xd4c0ff, size: 0.018, transparent: true, opacity: 0.35 }),
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
    const keys: Record<string, boolean> = {};
    const WALK_SPEED = 0.055;
    const WALL_MARGIN = 0.45;
    const moveDir = new THREE.Vector3();

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
        doorLights[hoveredDoor.userData.doorLightIndex].intensity = 0.22;
      }

      hoveredDoor = nextHovered;

      if (hoveredDoor) {
        hoveredDoor.material.emissiveIntensity = 0.2;
        hoveredDoor.userData.glowMat.opacity = 0.06;
        hoveredDoor.userData.transomMat.opacity = 0.2;
        doorLights[hoveredDoor.userData.doorLightIndex].intensity = 0.34;
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

    const onKeyDown = (e: KeyboardEvent) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) e.preventDefault();
      keys[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      clock += 0.012;

      yaw += (targetYaw - yaw) * 0.09;
      pitch += (targetPitch - pitch) * 0.09;
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;

      moveDir.set(0, 0, 0);
      if (keys["KeyW"]) moveDir.z -= 1;
      if (keys["KeyS"]) moveDir.z += 1;
      if (keys["KeyA"]) moveDir.x -= 1;
      if (keys["KeyD"]) moveDir.x += 1;
      if (moveDir.lengthSq() > 0) {
        moveDir.normalize().applyEuler(new THREE.Euler(0, yaw, 0)).multiplyScalar(WALK_SPEED);
        camera.position.x = Math.max(-(halfW - WALL_MARGIN), Math.min(halfW - WALL_MARGIN, camera.position.x + moveDir.x));
        camera.position.z = Math.max(-(halfD - WALL_MARGIN), Math.min(halfD - WALL_MARGIN, camera.position.z + moveDir.z));
        camera.position.y = 1.65;
      }

      pendantLight.intensity = 3.35 + Math.sin(clock * 0.65) * 0.06 + Math.sin(clock * 2.2) * 0.03;
      rugGlow.intensity = 0.7 + Math.sin(clock * 0.44) * 0.045;
      const warmFlicker = 6.2 + Math.sin(clock * 1.05) * 0.24 + Math.sin(clock * 2.7) * 0.11;
      tableLight.intensity = warmFlicker;
      lampFill.intensity = 1.3 + Math.sin(clock * 1.05) * 0.1 + Math.sin(clock * 2.7) * 0.04;
      windowGlow.intensity = 0.9 + Math.sin(clock * 0.19) * 0.08;

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
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

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
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

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
    <div className="relative h-full w-full overflow-hidden bg-[#0d0a1e]">
      <canvas ref={canvasRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-7">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-purple-300/25 text-purple-300/60 transition-colors hover:border-purple-300/60 hover:text-purple-100"
            title="Exit lobby"
          >
            ←
          </Link>
          <div className="text-[20px] uppercase tracking-[0.25em] text-purple-100/90">
            Memoir
            <span className="mt-1 block text-[11px] italic tracking-[0.4em] text-purple-300/75">Memory Palace</span>
          </div>
        </div>
        <div className="text-right text-[12px] italic tracking-[0.2em] text-purple-300/45">
          Drag to look around
          <br />
          Click a door to enter
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-7 flex justify-center">
        <div className="text-[12px] italic tracking-[0.2em] text-purple-200/70">{tooltipText}</div>
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
          className={`w-[90%] max-w-[360px] rounded-[14px] border border-purple-300/20 bg-[rgba(13,10,30,0.94)] px-11 py-9 text-center text-purple-100 backdrop-blur-md transition-all duration-300 ${selectedMemory ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-90 opacity-0"}`}
        >
          <div className="mb-3 text-[10px] uppercase tracking-[0.35em] text-purple-300/45">Memory</div>
          <div className="text-[26px] font-bold">{selectedMemory?.title ?? ""}</div>
          <div className="mb-7 mt-1 text-[13px] tracking-[0.15em] text-purple-200/55">{selectedMemory?.year ?? ""}</div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              disabled={!selectedMemory || isEntering}
              onClick={() => {
                if (!selectedMemory) return;
                setIsEntering(true);
                triggerFade(() => {
                  router.push(`/viewer/${selectedMemory.id}`);
                }, 600);
              }}
              className="rounded-md border border-purple-400/50 bg-purple-700/25 px-6 py-2.5 text-[14px] tracking-[0.05em] text-purple-100 transition-colors hover:bg-purple-700/40 disabled:cursor-not-allowed disabled:opacity-60"
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

          {isEntering ? <div className="mt-3 text-[13px] text-purple-300/45">Loading your world...</div> : null}
        </div>
      </div>

      {isMounted && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-50 bg-black transition-opacity ${isFading ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDuration: "600ms" }}
        />
      )}
    </div>
  );
}
