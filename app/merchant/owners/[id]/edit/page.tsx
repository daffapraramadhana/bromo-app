import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { OwnerForm } from "../../_form";

export default async function EditOwnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const merchantId = session!.user.merchantId!;
  const { id } = await params;
  const idPemilik = Number(id);
  if (!Number.isFinite(idPemilik)) notFound();

  const pemilik = await db.pemilik.findFirst({
    where: { idPemilik, merchantId },
  });
  if (!pemilik) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/owners/${idPemilik}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Kembali ke detail
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Edit Pemilik</h1>
        <p className="text-sm text-muted-foreground">
          Perubahan langsung disimpan. Status approval tidak berubah.
        </p>
      </div>
      <OwnerForm mode="edit" initial={pemilik} />
    </div>
  );
}
