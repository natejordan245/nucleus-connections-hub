import Link from "next/link";
import { DelicateArch } from "./DelicateArch";

export type HeaderViewer = {
  id: string;
  name: string;
  photoUrl?: string;
  profileHref: string | null;
  isAdmin?: boolean;
};

export function AppShell({
  viewer,
  deckBar,
  children,
}: {
  viewer: HeaderViewer | null;
  deckBar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-warmgray-50">
      {deckBar}
      <header className="border-b border-warmgray-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <Link
            href={viewer ? "/dashboard" : "/"}
            className="flex items-center gap-2.5"
          >
            <DelicateArch className="h-6 w-6 text-orange-500" aria-hidden />
            <span className="text-sm font-bold text-ink">Connections Hub</span>
          </Link>

          <div className="flex items-center gap-4">
            {viewer ? (
              <>
                <Link
                  href={viewer.profileHref ?? "/profile"}
                  className="text-xs font-medium text-warmgray-700 hover:text-ink"
                >
                  Profile
                </Link>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="text-xs font-medium text-warmgray-700 hover:text-ink"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="text-xs font-medium text-warmgray-700 hover:text-ink"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}
