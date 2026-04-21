import Link from "next/link";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

export function Sidebar({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  return (
    <aside className="w-60 shrink-0 border-r bg-card">
      <div className="p-5 border-b">
        <div className="text-sm text-muted-foreground">Explorin</div>
        <div className="font-semibold">{title}</div>
      </div>
      <nav className="p-3 space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
            )}
          >
            {it.icon}
            <span>{it.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
