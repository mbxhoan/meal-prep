import { AccountDropdownProps } from "../types";

export default function AccountDropdown({
  themeColor,
  isDesktop = true,
}: AccountDropdownProps) {
  const wrapperClass = isDesktop
    ? "absolute right-0 mt-4 w-64 bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden transform origin-top-right transition-all duration-200 ease-out"
    : "fixed left-0 right-0 top-[56px] mx-auto w-[95%] max-w-sm bg-white bg-opacity-95 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden transform origin-top z-[600]";

  const animation = isDesktop
    ? { animation: "scaleIn 0.2s ease-out forwards", zIndex: 600 }
    : { animation: "scaleIn 0.2s ease-out forwards" };

  return (
    <div className={wrapperClass} style={animation}>
      <div className={isDesktop ? "px-6 py-4" : "p-5"}>
        <h3 className="font-semibold text-gray-800 mb-3">My Account</h3>

        <div className="space-y-4">
          <div className={`flex flex-col ${isDesktop ? "gap-2" : "gap-3"}`}>
            <input
              type="email"
              placeholder="Email"
              className={`${
                isDesktop
                  ? "px-3 py-2 rounded-lg text-sm"
                  : "px-4 py-3 rounded-xl text-base"
              } 
                border border-gray-200 focus:outline-none focus:ring-2 bg-white bg-opacity-80`}
              style={
                { "--tw-ring-color": `${themeColor}80` } as React.CSSProperties
              }
            />
            <input
              type="password"
              placeholder="Password"
              className={`${
                isDesktop
                  ? "px-3 py-2 rounded-lg text-sm"
                  : "px-4 py-3 rounded-xl text-base"
              } 
                border border-gray-200 focus:outline-none focus:ring-2 bg-white bg-opacity-80`}
              style={
                { "--tw-ring-color": `${themeColor}80` } as React.CSSProperties
              }
            />
            <button
              className={`text-white ${
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
              Sign In
            </button>
          </div>

          <div
            className={`border-t border-gray-100 ${
              isDesktop ? "pt-2" : "pt-3"
            } text-center`}
          >
            <p
              className={`${
                isDesktop ? "text-xs" : "text-sm mb-2"
              } text-gray-500`}
            >
              Don&apos;t have an account?
            </p>
            <button
              className={`${
                isDesktop ? "text-sm" : "text-base"
              } font-medium transition-all duration-300`}
              style={{ color: themeColor }}
              onMouseOver={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
