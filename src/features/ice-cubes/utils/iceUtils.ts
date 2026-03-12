import { ElementConfig } from '../types';

// Helper function to get the correct image path based on element type and variant
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getImagePath(_elementType?: "cube" | "leaf", _variant?: 1 | 2): string {
    return `/assets/products/spices_nobg.png`;
}

// Function to generate elements with varying sizes and positions for each side
export function generateColumnElements(
    side: "left" | "right",
    cubeCount: number,
    leafCount: number
): ElementConfig[] {
    const elements: ElementConfig[] = [];

    // Create separate position slots for cubes and leaves
    // Each type gets distributed evenly within their own space

    // Generate cube positions (evenly distributed across 0-95%)
    const cubePositions: string[] = [];
    for (let i = 0; i < cubeCount; i++) {
        // Calculate exact position for cubes - evenly spaced
        const position = i * (95 / (cubeCount - 1 || 1));
        cubePositions.push(`${position}%`);
    }

    // Generate leaf positions (evenly distributed across 0-95%)
    const leafPositions: string[] = [];
    for (let i = 0; i < leafCount; i++) {
        // Calculate exact position for leaves - evenly spaced
        const position = i * (95 / (leafCount - 1 || 1));
        leafPositions.push(`${position}%`);
    }

    // Create cube elements with controlled sizes (limiting big cubes)
    const cubeElements: ElementConfig[] = [];

    // Calculate indices for big cubes - one in upper third, one in lower third
    // This ensures they are far apart from each other
    const firstBigCubeIndex = Math.floor(cubeCount * 0.2); // Around 20% from the top
    const secondBigCubeIndex = Math.floor(cubeCount * 0.8); // Around 80% from the top

    for (let i = 0; i < cubeCount; i++) {
        // For cubes, allow big size only at the specific positions
        const allowBigSize = (i === firstBigCubeIndex || i === secondBigCubeIndex) && cubeCount >= 4;

        cubeElements.push(
            createElementWithSizeControl(
                "cube",
                side,
                i,
                undefined,
                cubePositions[i],
                allowBigSize
            )
        );
    }

    // Sort cubes by size, largest first (to ensure the biggest ones are properly positioned)
    cubeElements.sort((a, b) => b.size - a.size);

    // Add all cube elements to the final elements array
    elements.push(...cubeElements);

    // Create leaf elements with their positions (no size restriction needed)
    for (let i = 0; i < leafCount; i++) {
        elements.push(
            createElement(
                "leaf",
                side,
                i + cubeCount, // Adding cubeCount to make indices unique
                ((i % 2) + 1) as 1 | 2, // Alternate between leaf variant 1 and 2
                leafPositions[i]
            )
        );
    }

    return elements;
}

// Create a single element with size control
export function createElementWithSizeControl(
    elementType: "cube" | "leaf",
    side: "left" | "right",
    index: number,
    variant?: 1 | 2,
    offsetY?: string,
    allowBigSize: boolean = false
): ElementConfig {
    // Increase size ranges, especially for leaves
    let minSize, maxSize;

    if (elementType === "cube") {
        if (allowBigSize) {
            // Big cubes size range
            minSize = side === "left" ? 80 : 90;
            maxSize = side === "left" ? 100 : 110;
        } else {
            // Regular cubes size range (smaller)
            minSize = side === "left" ? 40 : 50;
            maxSize = side === "left" ? 70 : 80;
        }
    } else {
        // Leaf sizes remain unchanged
        minSize = side === "left" ? 45 : 50;
        maxSize = side === "left" ? 90 : 100;
    }

    const size = Math.floor(Math.random() * (maxSize - minSize)) + minSize;

    // Different rotation ranges for left and right sides
    const rotationBase = elementType === "leaf" ? 30 : 20;
    const rotationFactor = side === "left" ? -rotationBase : rotationBase;
    const rotation = `rotate(${Math.floor(Math.random() * 30) + rotationFactor}deg)`;

    // Add random flipping
    const flipX = Math.random() > 0.5 ? -1 : 1;
    const flipY = Math.random() > 0.5 ? -1 : 1;

    // Opacity settings
    const opacityBase = side === "left" ? 0.6 : 0.65;
    const opacity = Math.random() * 0.3 + opacityBase;

    // Make z-index directly proportional to size
    // This ensures larger elements appear on top
    const zIndex = Math.floor(size / 10) + 5; // Size 40 -> z-index 9, Size 100 -> z-index 15

    // Animation delay
    const delayFactor = side === "left" ? 0 : 0.5;
    const animationDelay = Math.random() * 2 + delayFactor;

    return {
        size,
        rotation,
        flipX,
        flipY,
        zIndex,
        opacity,
        elementType,
        variant,
        offsetY: offsetY || "0%",
        animationDelay,
    };
}

// Create a single element
export function createElement(
    elementType: "cube" | "leaf",
    side: "left" | "right",
    index: number,
    variant?: 1 | 2,
    offsetY?: string
): ElementConfig {
    // Increase size ranges, especially for leaves
    let minSize, maxSize;

    if (elementType === "cube") {
        minSize = side === "left" ? 40 : 50;
        maxSize = side === "left" ? 100 : 110;
    } else {
        // Make leaves bigger
        minSize = side === "left" ? 45 : 50;
        maxSize = side === "left" ? 90 : 100;
    }

    const size = Math.floor(Math.random() * (maxSize - minSize)) + minSize;

    // Different rotation ranges for left and right sides
    const rotationBase = elementType === "leaf" ? 30 : 20;
    const rotationFactor = side === "left" ? -rotationBase : rotationBase;
    const rotation = `rotate(${Math.floor(Math.random() * 30) + rotationFactor}deg)`;

    // Add random flipping
    const flipX = Math.random() > 0.5 ? -1 : 1;
    const flipY = Math.random() > 0.5 ? -1 : 1;

    // Opacity settings
    const opacityBase = side === "left" ? 0.6 : 0.65;
    const opacity = Math.random() * 0.3 + opacityBase;

    // Make z-index directly proportional to size
    // This ensures larger elements appear on top
    const zIndex = Math.floor(size / 10) + 5; // Size 40 -> z-index 9, Size 100 -> z-index 15

    // Animation delay
    const delayFactor = side === "left" ? 0 : 0.5;
    const animationDelay = Math.random() * 2 + delayFactor;

    return {
        size,
        rotation,
        flipX,
        flipY,
        zIndex,
        opacity,
        elementType,
        variant,
        offsetY: offsetY || "0%",
        animationDelay,
    };
}

// Fisher-Yates shuffle algorithm to mix elements
export function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Enhanced process for blur with multiple levels
export function processElementsForBlur(elements: ElementConfig[]): ElementConfig[] {
    // Sort elements by size (largest to smallest)
    const sortedBySize = [...elements].sort((a, b) => b.size - a.size);

    // Calculate size thresholds for different blur levels
    const totalCount = elements.length;
    const noBlurThreshold = sortedBySize[Math.floor(totalCount * 0.6)]?.size || 0; // Top 60% - no blur
    const lightBlurThreshold = sortedBySize[Math.floor(totalCount * 0.8)]?.size || 0; // Next 20% - light blur
    // Bottom 20% - heavier blur

    // Return original elements with blur levels added
    return elements.map(element => {
        let blurLevel = 0;

        if (element.size < lightBlurThreshold) {
            blurLevel = 2; // Heavy blur for smallest 20%
        } else if (element.size < noBlurThreshold) {
            blurLevel = 1; // Light blur for next 20%
        } // No blur for top 60%

        return {
            ...element,
            blurLevel
        };
    });
}
