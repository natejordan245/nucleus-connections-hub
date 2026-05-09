import { AppShell } from "@/components/AppShell";
import { isDemoActive } from "@/lib/demo/cookie";
import { getHeaderViewer } from "@/lib/viewer";

/**
 * Layout for the signed-in surface. The route group `(app)` doesn't affect
 * URLs but lets the App Router preserve `<AppShell>` (sidebar + top rail)
 * across client-side navigation between pages inside the group.
 */
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getHeaderViewer();
  const demoActive = isDemoActive();
  return (
    <AppShell viewer={viewer} demoActive={demoActive}>
      {children}
    </AppShell>
  );
}
