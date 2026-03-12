import { JuiceCan, PositionConfig } from "../types";

// Juice can data with 3D model paths (now using images rendered in 3D)
export const juiceCans: JuiceCan[] = [
    {
        name: "Marinated Chicken",
        color: "#D37B40", 
        model: "/assets/products/chicken_nobg.png",
        position: "top", // 12 o'clock
    },
    {
        name: "Premium Beef",
        color: "#8C2A2A", 
        model: "/assets/products/beef_nobg.png",
        position: "right", // 3 o'clock
    },
    {
        name: "BBQ Ribs",
        color: "#592E25", 
        model: "/assets/products/ribs_nobg.png",
        position: "bottom", // 6 o'clock
    },
    {
        name: "Citrus Salmon",
        color: "#F47B62", 
        model: "/assets/products/salmon_nobg.png",
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
