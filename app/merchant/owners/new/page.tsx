import Link from "next/link";
import { OwnerForm } from "../_form";

export default function NewOwnerPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/owners" className="text-xs text-muted-foreground hover:underline">
          ← Kembali ke daftar pemilik
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Pemilik Baru</h1>
        <p className="text-sm text-muted-foreground">
          Buat data pemilik beserta kendaraannya sekaligus. Data disimpan
          sebagai draft dan dapat diajukan ke Manager untuk approval.
        </p>
      </div>
      <OwnerForm mode="create" />
    </div>
  );
}
