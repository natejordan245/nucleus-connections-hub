import { AppSidebar, type SidebarViewer } from "./AppSidebar";
import { ModeBadge } from "./ModeBadge";
import { NotificationBell } from "./NotificationBell";

export function AppShell({
  viewer,
  deckBar,
  children,
}: {
  viewer: SidebarViewer | null;
  deckBar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-paper">
      <AppSidebar viewer={viewer} />
      <div className="flex min-w-0 flex-1 flex-col">
        {deckBar}
        <header className="flex h-16 items-center justify-end gap-3 border-b border-warmgray-100 bg-white px-6">
          <ModeBadge />
          {viewer && <NotificationBell viewerId={viewer.id} />}
          {viewer && (
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-warmgray-700 hover:text-ink"
              >
                Sign out
              </button>
            </form>
          )}
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
