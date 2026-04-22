import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VehicleForm } from "../_form";

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string }>;
}) {
  const session = await auth();
  const merchantId = session!.user.merchantId!;
  const { owner: preselectedParam } = await searchParams;
  const preselectedOwner = preselectedParam ? Number(preselectedParam) : undefined;

  const owners = await db.pemilik.findMany({
    where: { merchantId },
    orderBy: { nama: "asc" },
    select: { idPemilik: true, nama: true, tipePemilik: true },
  });

  if (owners.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Kendaraan Baru</h1>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Belum ada pemilik terdaftar. Buat pemilik terlebih dahulu agar dapat
            menambahkan kendaraan.
            <div className="mt-3">
              <Link href="/owners/new">
                <Button size="sm">+ Buat Pemilik</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/vehicles" className="text-xs text-muted-foreground hover:underline">
          ← Kembali ke daftar kendaraan
        </Link>
        <h1 className="text-2xl font-semibold mt-1">Kendaraan Baru</h1>
      </div>
      <VehicleForm mode="create" owners={owners} preselectedOwner={preselectedOwner} />
    </div>
  );
}
