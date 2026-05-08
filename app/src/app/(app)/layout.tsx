import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { DemoSlideBar } from "@/components/DemoSlideBar";
import { isDemoActive } from "@/lib/demo/cookie";
import { getSidebarViewer } from "@/lib/viewer";

/**
 * Layout for the signed-in surface. The route group `(app)` doesn't affect
 * URLs but lets the App Router preserve `<AppShell>` (sidebar + top rail)
 * across client-side navigation between pages inside the group.
 */
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getSidebarViewer();
  const demoActive = isDemoActive();
  return (
    <AppShell viewer={viewer}>
      {children}
      <Suspense fallback={null}>
        <DemoSlideBar active={demoActive} />
      </Suspense>
    </AppShell>
  );
}
