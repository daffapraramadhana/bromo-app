import Link from "next/link";
import { DriverForm } from "../_form";

export default function NewDriverPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/drivers" className="text-xs text-muted-foreground hover:underline">
          ← Kembali ke daftar driver
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Driver Baru</h1>
        <p className="text-sm text-muted-foreground">
          Data disimpan sebagai draft dan perlu diajukan ke Manager.
        </p>
      </div>
      <DriverForm mode="create" />
    </div>
  );
}
