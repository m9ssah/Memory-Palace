"use client";

import dynamic from "next/dynamic";

const Brain3D = dynamic(() => import("./Brain3D"), { ssr: false });

export default function Brain3DWrapper() {
  return <Brain3D />;
}
