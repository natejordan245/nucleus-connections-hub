import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-8">
      <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
        <LandingCard href="/login">login</LandingCard>
        <LandingCard href="/demo/cold-open">demo</LandingCard>
      </div>
    </main>
  );
}

function LandingCard({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const className =
    "flex items-center justify-center rounded-2xl border border-warmgray-100 bg-white py-20 font-serif text-5xl font-semibold text-ink shadow-sm transition duration-200 hover:scale-[1.03] hover:border-ink hover:bg-ink hover:text-white hover:shadow-md sm:text-6xl";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
