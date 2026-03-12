import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Can3DProps } from "../types";

// Component for loading and rendering a 3D can model
export default function Can3D({
  modelPath,
  rotate = [0, 0, 0],
  animate = true,
  animationSpeed = 0.5,
  oscillationAmplitude = [0.05, 0.03, 0.05],
  onLoaded,
  isMobile = false,
}: Can3DProps) {
  const { scene } = useGLTF(modelPath);
  const modelRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const loadedRef = useRef(false);
  const prevMobileRef = useRef(isMobile);
  const [hovered, setHovered] = useState(false);

  // Handle hover state to change cursor
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = "grab";
    } else {
      document.body.style.cursor = "auto";
    }

    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  // Custom smooth oscillation function that doesn't glitch at cycle boundaries
  const smoothOscillation = (time: number, frequency: number) => {
    const t = (time * frequency) % 2;
    return t <= 1 ? t : 2 - t;
  };

  // Reset animation timing when mobile state changes to ensure immediate effect
  useEffect(() => {
    if (prevMobileRef.current !== isMobile) {
      timeRef.current = 0;
      prevMobileRef.current = isMobile;

      // Force immediate update of model rotation
      if (modelRef.current) {
        modelRef.current.rotation.x = rotate[0];
        modelRef.current.rotation.y = rotate[1];
        modelRef.current.rotation.z = rotate[2];
      }
    }
  }, [isMobile, rotate]);

  // Animation using useFrame for oscillating motion
  useFrame((_state, delta) => {
    if (modelRef.current && animate) {
      timeRef.current += delta * animationSpeed;

      // Reduce oscillation on mobile - defined here for immediate effect
      const mobileMultiplier = isMobile ? 0.3 : 1;

      const xOffset =
        (smoothOscillation(timeRef.current, 0.3) * 2 - 1) *
        oscillationAmplitude[0] *
        mobileMultiplier;
      const yOffset =
        (smoothOscillation(timeRef.current, 0.2) * 2 - 1) *
        oscillationAmplitude[1] *
        mobileMultiplier;
      const zOffset =
        (smoothOscillation(timeRef.current, 0.25) * 2 - 1) *
        oscillationAmplitude[2] *
        mobileMultiplier;

      modelRef.current.rotation.x = rotate[0] + xOffset;
      modelRef.current.rotation.y = rotate[1] + yOffset;
      modelRef.current.rotation.z = rotate[2] + zOffset;
    }
  });

  useEffect(() => {
    if (modelRef.current) {
      const clonedScene = scene.clone();

      clonedScene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const mesh = o as THREE.Mesh;

          if (mesh.material) {
            if (mesh.material instanceof THREE.MeshStandardMaterial) {
              mesh.material.metalness = 0.95;
              mesh.material.roughness = 0.02;
              mesh.material.alphaTest = 0.1;
            }
          }
        }
      });

      while (modelRef.current.children.length > 0) {
        modelRef.current.remove(modelRef.current.children[0]);
      }

      modelRef.current.add(clonedScene);

      if (onLoaded && !loadedRef.current) {
        loadedRef.current = true;
        setTimeout(() => {
          if (onLoaded) onLoaded();
        }, 200);
      }
    }
  }, [scene, onLoaded]);

  // Scale and position adjustments for mobile
  const scale = isMobile ? 0.75 : 1;
  const position = [0.005, 0.045, 0];

  return (
    <group
      ref={modelRef}
      rotation={rotate}
      scale={scale}
      position={position as [number, number, number]}
      castShadow
      receiveShadow
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={() => {
        document.body.style.cursor = "grabbing";
      }}
      onPointerUp={() => {
        document.body.style.cursor = hovered ? "grab" : "auto";
      }}
    ></group>
  );
}
