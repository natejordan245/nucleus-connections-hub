import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connections Hub",
  description:
    "AI-powered talent ↔ startup matching for the Utah innovation ecosystem.",
  icons: {
    icon: [{ url: "/icon.webp", type: "image/webp" }],
    shortcut: ["/icon.webp"],
    apple: [{ url: "/icon.webp", type: "image/webp" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
