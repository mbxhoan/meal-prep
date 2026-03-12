export interface JuiceCan {
    name: string;
    color: string;
    model: string;
    position: string;
}

export interface PositionConfig {
    className: string;
    transformOrigin: string;
    rotation: [number, number, number];
}

export interface Can3DProps {
    modelPath: string;
    rotate?: [number, number, number];
    animate?: boolean;
    animationSpeed?: number;
    oscillationAmplitude?: [number, number, number];
    onLoaded?: () => void;
    isMobile?: boolean;
}

export interface JuiceCarouselProps {
    onCanChange?: (canName: string) => void;
    enableScrollNavigation?: boolean;
}

export interface CarouselControlsProps {
    onPrev: () => void;
    onNext: () => void;
    isAnimating: boolean;
    isActiveModelLoaded: boolean;
    isMobile: boolean;
}

export interface CanvasContainerProps {
    modelPath: string;
    rotation: [number, number, number];
    isMobile: boolean;
    isActivePosition: boolean;
    onLoaded?: () => void;
}

export interface CarouselWheelProps {
    activeIndex: number;
    isMobile: boolean;
    onActiveModelLoaded: () => void;
    wheelRef: React.RefObject<HTMLDivElement>;
}

export interface FruitsContainerProps {
    isVisible: boolean;
    currentJuiceType: string;
    nextJuiceType: string | null;
    isTransitioning: boolean;
}

export interface LoadingIndicatorProps {
    isLoading: boolean;
}
