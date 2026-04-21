import Link from "next/link";

// This page is only reachable when middleware doesn't rewrite (e.g. dev).
// Middleware rewrites `/` on the root host to `/admin`, and on the merchant
// host to `/merchant`, so this is effectively a fallback.
export default function RootPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 space-y-6">
      <h1 className="text-3xl font-semibold">Explorin Platform</h1>
      <p className="text-muted-foreground">
        Pilih portal sesuai peran Anda.
      </p>
      <div className="flex gap-3">
        <Link
          href="/admin"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          SuperAdmin (MKW)
        </Link>
        <Link
          href="/merchant"
          className="rounded-md border px-4 py-2"
        >
          Merchant Portal
        </Link>
      </div>
    </main>
  );
}
