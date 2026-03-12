import Image from "next/image";
import { CartDropdownProps } from "../types";
import { getTotalPrice } from "../config";

export default function CartDropdown({
  cartItems,
  themeColor,
  isDesktop = true,
  onClose,
}: CartDropdownProps) {
  const wrapperClass = isDesktop
    ? "absolute right-0 mt-4 w-80 bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden transform origin-top-right transition-all duration-200 ease-out"
    : "fixed left-0 right-0 top-[56px] mx-auto w-[95%] max-w-sm bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden transform origin-top z-[600]";

  const animation = isDesktop
    ? { animation: "scaleIn 0.2s ease-out forwards", zIndex: 600 }
    : { animation: "scaleIn 0.2s ease-out forwards" };

  const totalPrice = getTotalPrice(cartItems);

  return (
    <div className={wrapperClass} style={animation}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">Shopping Cart</h3>
          {!isDesktop && (
            <button
              className="text-gray-400 hover:text-gray-600 p-1"
              onClick={onClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div
          className={`space-y-3 ${
            isDesktop ? "max-h-60" : "max-h-[40vh]"
          } overflow-y-auto styled-scrollbar`}
        >
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg"
            >
              <div
                className={`${
                  isDesktop ? "w-12 h-12" : "w-14 h-14"
                } bg-gray-100 rounded-md overflow-hidden flex-shrink-0`}
              >
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Image
                    src={item.image}
                    alt={item.name}
                    className="object-contain w-full h-[80%]"
                    width={isDesktop ? 48 : 56}
                    height={isDesktop ? 48 : 56}
                  />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-800">
                  {item.name}
                </h4>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                  <p className="text-sm font-medium text-gray-800">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                className={`text-gray-400 hover:text-gray-600 ${
                  !isDesktop && "p-2"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                  <path
                    fillRule="evenodd"
                    d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="border-t border-gray-100 mt-3 pt-3">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-semibold text-gray-800">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="space-y-2">
            <button
              className={`w-full text-white ${
                isDesktop
                  ? "py-2 px-4 rounded-lg text-sm"
                  : "py-3 px-4 rounded-xl text-base"
              } 
                font-medium transition-all duration-300`}
              style={{ backgroundColor: themeColor }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Checkout
            </button>
            <button
              className={`w-full ${
                isDesktop
                  ? "py-2 px-4 rounded-lg text-sm"
                  : "py-3 px-4 rounded-xl text-base"
              } 
                font-medium transition-all duration-300 border`}
              style={{
                color: themeColor,
                borderColor: `${themeColor}40`,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              View Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
