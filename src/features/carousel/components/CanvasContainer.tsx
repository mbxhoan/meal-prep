import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, PresentationControls } from "@react-three/drei";
import * as THREE from "three";
import Can3D from "./Can3D";
import ThreeLoader from "./ThreeLoader";
import { CanvasContainerProps } from "../types";

export default function CanvasContainer({
  modelPath,
  rotation,
  isMobile,
  isActivePosition,
  onLoaded,
}: CanvasContainerProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
          antialias: true,
          alpha: true,
          powerPreference: isMobile ? "default" : "high-performance",
        }}
        camera={{
          position: [0, 0, 1],
          fov: isMobile ? 24 : 22,
          near: 0.01,
          far: 100,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={<ThreeLoader />}>
          <PresentationControls
            global={false} // Only control the targeted object, not globally
            cursor={false} // Don't override cursor styles
            snap={true} // Return to original position when released
            speed={isMobile ? 1.5 : 1}
            zoom={1}
            rotation={[0, 0, 0.1]}
            polar={[0, Math.PI / 10]}
            azimuth={[-Math.PI, Math.PI]}
          >
            <Can3D
              modelPath={modelPath}
              rotate={rotation}
              animate={true}
              animationSpeed={0.6}
              oscillationAmplitude={[0.05, 0.03, 0.05]}
              onLoaded={isActivePosition ? onLoaded : undefined}
              isMobile={isMobile}
            />
          </PresentationControls>
          <Environment
            preset="forest"
            resolution={isMobile ? 2 : 8}
            environmentIntensity={1.2}
          />
          <ambientLight intensity={10} />
          <directionalLight intensity={20} position={[5, 5, 5]} />
          <directionalLight intensity={10} position={[-1, -1, -1]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
