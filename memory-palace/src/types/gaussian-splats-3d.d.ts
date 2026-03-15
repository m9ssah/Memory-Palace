declare module "@mkkellogg/gaussian-splats-3d" {
  import * as THREE from "three";

  export type DropInViewerOptions = {
    gpuAcceleratedSort?: boolean;
    sharedMemoryForWorkers?: boolean;
    renderer: THREE.WebGLRenderer;
    camera: THREE.Camera;
    scene: THREE.Scene;
  };

  export type SplatSceneDefinition = {
    path: string;
    splatAlphaRemovalThreshold?: number;
    format?: number;
    position?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
    onProgress?: (percent: number, percentLabel: string, loaderStatus: unknown) => void;
  };

  export class DropInViewer extends THREE.Object3D {
    constructor(options: DropInViewerOptions);
    addSplatScenes(scenes: SplatSceneDefinition[]): Promise<void>;
    dispose(): void;
  }
}
