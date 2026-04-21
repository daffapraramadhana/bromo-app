import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/merchants", label: "Merchants" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") {
    // Non-super-admins don't belong on root host — push them to merchant.
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar title="SuperAdmin (MKW)" items={NAV} />
      <div className="flex-1">
        <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {session.user.name ?? session.user.email}
          </div>
          <div className="text-xs text-muted-foreground">Platform MKW</div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
