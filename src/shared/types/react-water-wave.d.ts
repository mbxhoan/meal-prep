declare module "react-water-wave" {
    import { ReactNode, CSSProperties } from "react";

    interface WaterWaveProps {
        imageUrl: string;
        dropRadius?: number;
        perturbance?: number;
        resolution?: number;
        interactive?: boolean;
        style?: CSSProperties;
        className?: string;
        children?: (props: { pause: () => void; play: () => void }) => ReactNode;
    }

    const WaterWave: React.FC<WaterWaveProps>;
    export default WaterWave;
}
