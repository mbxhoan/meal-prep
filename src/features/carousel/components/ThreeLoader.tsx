import { Html } from "@react-three/drei";
import { LoadingSpinner } from "@/shared";

// Simple static loader that doesn't trigger state updates during render
export default function ThreeLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center">
        <LoadingSpinner color="white" size={20} />
        <span className="text-white text-xs mt-1 opacity-80">Loading...</span>
      </div>
    </Html>
  );
}
