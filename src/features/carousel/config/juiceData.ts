import { JuiceCan, PositionConfig } from "../types";

// Juice can data with 3D model paths
export const juiceCans: JuiceCan[] = [
    {
        name: "Lemon Ginger",
        color: "#82AF38", // Green
        model: "/assets/3d/can/lemon.glb",
        position: "top", // 12 o'clock
    },
    {
        name: "Blueberry Açai",
        color: "#6A5ACD", // Purple
        model: "/assets/3d/can/blueberry.glb",
        position: "right", // 3 o'clock
    },
    {
        name: "Mango Burst",
        color: "#FFA500", // Orange
        model: "/assets/3d/can/mango.glb",
        position: "bottom", // 6 o'clock
    },
    {
        name: "Raspberry Rosé",
        color: "#FF6B81", // Pink
        model: "/assets/3d/can/raspberry.glb",
        position: "left", // 9 o'clock
    },
];

// Position configurations
export const positionConfigs: PositionConfig[] = [
    {
        className: "absolute top-0 left-1/2 -translate-x-1/2",
        transformOrigin: "center center",
        rotation: [0, Math.PI / 3, 0],
    },
    {
        className: "absolute top-1/2 right-0  -translate-y-1/2 rotate-90",
        transformOrigin: "center center",
        rotation: [0, Math.PI / 3, 0],
    },
    {
        className: "absolute bottom-0 left-1/2 -translate-x-1/2 rotate-180",
        transformOrigin: "center center",
        rotation: [0, Math.PI / 3, 0],
    },
    {
        className: "absolute top-1/2 left-0 -translate-y-1/2  rotate-270",
        transformOrigin: "center center",
        rotation: [0, Math.PI / 3, 0],
    },
];
