import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/approvals", label: "Approval Queue" },
  { href: "/owners", label: "Pemilik" },
  { href: "/vehicles", label: "Kendaraan" },
  { href: "/drivers", label: "Driver" },
  { href: "/users", label: "Users & Roles" },
];

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "SUPER_ADMIN") redirect("/");
  if (!session.user.merchantId) {
    throw new Error("User tidak terhubung ke merchant mana pun");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar title="Merchant Portal" items={NAV} />
      <div className="flex-1">
        <header className="border-b bg-card px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {session.user.name ?? session.user.email}
          </div>
          <div className="text-xs text-muted-foreground">
            Role: {session.user.role}
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
