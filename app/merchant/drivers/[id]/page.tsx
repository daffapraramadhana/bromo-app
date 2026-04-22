import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { ApprovalActions } from "@/components/approval-actions";
import { formatDate, formatIDR } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm border-b last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value ?? "—"}</div>
    </div>
  );
}

export default async function DriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const merchantId = session!.user.merchantId!;
  const { id } = await params;
  const idDriver = Number(id);
  if (!Number.isFinite(idDriver)) notFound();

  const driver = await db.driver.findFirst({ where: { idDriver, merchantId } });
  if (!driver) notFound();

  const logs = await db.approvalLog.findMany({
    where: { approvableType: "driver", approvableId: String(idDriver) },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/drivers" className="text-xs text-muted-foreground hover:underline">
            ← Kembali ke daftar driver
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{driver.nama}</h1>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={driver.status} />
            <span>SIM {driver.jenisSim} · {driver.tipeDriver}</span>
          </div>
        </div>
        <ApprovalActions
          type="driver"
          id={idDriver}
          status={driver.status}
          role={session!.user.role}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Informasi Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="NIK" value={driver.nik} />
            <Row label="No. SIM" value={<span className="font-mono">{driver.noSim}</span>} />
            <Row label="Jenis SIM" value={driver.jenisSim} />
            <Row label="Masa Berlaku SIM" value={formatDate(driver.masaBerlakuSim)} />
            <Row label="Tempat / Tanggal Lahir" value={
              [driver.tempatLahir, formatDate(driver.tanggalLahir)].filter((v) => v && v !== "—").join(", ")
            } />
            <Row label="Alamat" value={driver.alamat} />
            <Row label="No. HP" value={driver.noHp} />
            <Row label="Email" value={driver.email} />
            <Row label="Status Operasional" value={driver.statusDriver} />
            <Row label="Tipe" value={driver.tipeDriver} />
            <Row label="Bergabung" value={formatDate(driver.tanggalBergabung)} />
            <Row label="Tarif Harian" value={formatIDR(driver.tarifHarian ? Number(driver.tarifHarian) : null)} />
            <Row label="Kontak Darurat" value={
              driver.namaKontakDarurat
                ? `${driver.namaKontakDarurat} (${driver.noHpDarurat ?? ""})`
                : null
            } />
            <Row label="Catatan" value={driver.catatan} />
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
