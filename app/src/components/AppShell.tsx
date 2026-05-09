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
    <div className="min-h-screen bg-paper">
      {deckBar}
      <header className="border-b border-warmgray-100 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-8">
          <Link
            href={viewer ? "/dashboard" : "/"}
            className="flex items-center gap-3"
          >
            <DelicateArch className="h-7 w-7 text-orange-500" aria-hidden />
            <span className="font-serif text-base font-semibold text-ink">
              Nucleus
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {viewer ? (
              <>
                <Link
                  href={viewer.profileHref ?? "/profile"}
                  className="text-sm font-medium text-warmgray-700 hover:text-ink"
                >
                  Profile
                </Link>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="text-sm font-medium text-warmgray-700 hover:text-ink"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-warmgray-700 hover:text-ink"
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
