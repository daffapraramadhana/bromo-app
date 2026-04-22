import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { VehicleForm } from "../../_form";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const merchantId = session!.user.merchantId!;
  const { id } = await params;
  const idMobil = Number(id);
  if (!Number.isFinite(idMobil)) notFound();

  const mobil = await db.mobil.findFirst({
    where: { idMobil, merchantId },
    include: { pemilik: { select: { nama: true } } },
  });
  if (!mobil) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/vehicles/${idMobil}`} className="text-xs text-muted-foreground hover:underline">
          ← Kembali ke detail
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Edit Kendaraan</h1>
      </div>
      <VehicleForm mode="edit" initial={mobil} />
    </div>
  );
}
