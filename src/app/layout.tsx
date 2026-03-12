import type { Metadata } from "next";
import { Inconsolata } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
});

const thunder = localFont({
  src: [
    {
      path: './fonts/Thunder-BlackLC.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Thunder-BlackLC.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Thunder-BlackLC.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: "--font-thunder",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Juicy - Premium Juice Selection",
  description:
    "Discover a world of vibrant flavors with our premium juice selection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="w-screen overflow-hidden">
      <body
        className={`${inconsolata.variable} ${thunder.variable} antialiased w-screen overflow-hidden `}
      >
        {children}
      </body>
    </html>
  );
}
