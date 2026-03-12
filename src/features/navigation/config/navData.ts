import { CartItem } from '../types';

// Sample cart items for demonstration
export const sampleCartItems: CartItem[] = [
    {
        id: 1,
        name: "Lemon Ginger Soda",
        price: 4.99,
        quantity: 1,
        image: "/assets/images/can/lemon.webp",
    },
    {
        id: 2,
        name: "Blueberry Açai Soda",
        price: 5.49,
        quantity: 1,
        image: "/assets/images/can/blueberry.webp",
    },
];

export const getTotalPrice = (items: CartItem[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};
