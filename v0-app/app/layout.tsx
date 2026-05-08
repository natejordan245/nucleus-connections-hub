import "./globals.css";
import type { Metadata } from "next";
import { SlideProvider } from "@/lib/demo/SlideController";
import { DemoHeader } from "@/lib/demo/DemoHeader";

export const metadata: Metadata = {
  title: "Nucleus Connections Hub",
  description: "AI-powered talent ↔ startup matching for the Utah innovation ecosystem.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-warmgray-50 text-ink">
        <SlideProvider>
          <DemoHeader />
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </SlideProvider>
      </body>
    </html>
  );
}
