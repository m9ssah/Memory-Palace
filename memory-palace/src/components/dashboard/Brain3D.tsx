"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function createBrainGeometry() {
  const resolution = 128;

  // Main cerebrum 
  const cerebrum = new THREE.SphereGeometry(1.6, resolution, resolution);
  cerebrum.scale(1, 0.85, 1.1);

  const pos = cerebrum.attributes.position;
  const normal = cerebrum.attributes.normal;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // central fissure 
    const fissureDepth = Math.exp(-x * x * 8) * 0.15;

    // brain folds
    let fold = 0;
    fold += Math.sin(x * 8 + z * 6) * 0.04;
    fold += Math.sin(y * 10 + x * 4) * 0.035;
    fold += Math.sin(z * 12 + y * 8) * 0.03;
    fold += Math.sin(x * 15 + y * 12 + z * 10) * 0.02;
    fold += Math.sin(x * 20 - z * 15) * 0.015;

    // Flatten bottom slightly for brain stem area
    const bottomFlatten = y < -0.5 ? (y + 0.5) * 0.3 : 0;

    const nx = normal.getX(i);
    const ny = normal.getY(i);
    const nz = normal.getZ(i);

    pos.setXYZ(
      i,
      x + nx * (fold - fissureDepth) + nx * bottomFlatten,
      y + ny * (fold - fissureDepth) + ny * bottomFlatten,
      z + nz * (fold - fissureDepth) + nz * bottomFlatten
    );
  }

  cerebrum.computeVertexNormals();
  return cerebrum;
}

function BrainMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const coreMat = useRef<THREE.MeshStandardMaterial>(null);

  const geometry = useMemo(() => createBrainGeometry(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(t * 0.15) * 0.15;
    }
    if (coreMat.current) {
      coreMat.current.emissiveIntensity = 1.2 + Math.sin(t * 0.8) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group rotation={[0.2, -0.3, 0.1]}>
        {/* Core brain */}
        <mesh ref={meshRef} geometry={geometry}>
          <meshStandardMaterial
            ref={coreMat}
            color="#e9d5ff"
            emissive="#8954b2"
            emissiveIntensity={1.2}
            transparent
            opacity={0.55}
            roughness={0.6}
            metalness={0}
          />
        </mesh>

        {/* Inner glow layer */}
        <mesh ref={glowRef} geometry={geometry} scale={0.93}>
          <meshBasicMaterial
            color="#6d04e5"
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Mid glow shell */}
        <mesh geometry={geometry} scale={1.06}>
          <meshBasicMaterial
            color="#d35be6"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Outer glow aura */}
        <mesh geometry={geometry} scale={1.18}>
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.06}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Soft bloom shell */}
        <mesh geometry={geometry} scale={1.35}>
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.025}
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function Brain3D() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <OrbitControls
          enableZoom
          enableRotate={false}
          enablePan={false}
          minDistance={2}
          maxDistance={10}
        />
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 3]} intensity={2} color="#e9d5ff" />
        <pointLight position={[2, 1, -1]} intensity={1} color="#f0abfc" />
        <pointLight position={[-2, -1, 2]} intensity={0.8} color="#c084fc" />
        <BrainMesh />
      </Canvas>
    </div>
  );
}
