import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Connections Hub",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink antialiased">
      {children}
    </div>
  );
}
