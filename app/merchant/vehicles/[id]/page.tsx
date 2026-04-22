import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { ApprovalActions } from "@/components/approval-actions";
import { can } from "@/lib/rbac";
import { formatDate, formatIDR } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm border-b last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value ?? "—"}</div>
    </div>
  );
}

export default async function VehicleDetailPage({
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
    include: { pemilik: { select: { idPemilik: true, nama: true } } },
  });
  if (!mobil) notFound();

  const logs = await db.approvalLog.findMany({
    where: { approvableType: "mobil", approvableId: String(idMobil) },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/vehicles" className="text-xs text-muted-foreground hover:underline">
            ← Kembali ke daftar kendaraan
          </Link>
          <h1 className="text-2xl font-semibold mt-1">
            {mobil.merk} {mobil.tipe}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={mobil.status} />
            <span>
              Pemilik:{" "}
              <Link
                href={`/owners/${mobil.pemilik.idPemilik}`}
                className="hover:underline text-foreground"
              >
                {mobil.pemilik.nama}
              </Link>
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(session!.user.role, "data:input") && (
            <Link href={`/vehicles/${idMobil}/edit`}>
              <Button size="sm" variant="outline">Edit</Button>
            </Link>
          )}
          <ApprovalActions
            type="mobil"
            id={idMobil}
            status={mobil.status}
            role={session!.user.role}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Informasi Kendaraan</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="No. Polisi" value={<span className="font-mono">{mobil.noPolisi}</span>} />
            <Row label="No. Rangka" value={<span className="font-mono">{mobil.noRangka}</span>} />
            <Row label="No. Mesin" value={<span className="font-mono">{mobil.noMesin}</span>} />
            <Row label="Tahun Pembuatan" value={mobil.tahunPembuatan} />
            <Row label="Tahun Kendaraan (STNK)" value={mobil.tahunKendaraan} />
            <Row label="Warna" value={mobil.warna} />
            <Row label="Kapasitas" value={mobil.kapasitas ? `${mobil.kapasitas} orang` : null} />
            <Row label="Masa Berlaku Pajak" value={formatDate(mobil.masaBerlakuPajak)} />
            <Row
              label="Harga Sewa Harian"
              value={formatIDR(mobil.hargaSewaHarian ? Number(mobil.hargaSewaHarian) : null)}
            />
            <Row label="Status Operasional" value={mobil.statusMobil} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base text-foreground">Riwayat Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline logs={logs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
