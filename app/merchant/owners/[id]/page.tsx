import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Th, Tr, Td } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { ApprovalActions } from "@/components/approval-actions";
import { can } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm border-b last:border-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value ?? "—"}</div>
    </div>
  );
}

export default async function OwnerDetailPage({
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
    include: { mobils: { orderBy: { createdAt: "desc" } } },
  });
  if (!pemilik) notFound();

  const logs = await db.approvalLog.findMany({
    where: { approvableType: "pemilik", approvableId: String(idPemilik) },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/owners" className="text-xs text-muted-foreground hover:underline">
            ← Kembali ke daftar pemilik
          </Link>
          <h1 className="text-2xl font-semibold mt-1">{pemilik.nama}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={pemilik.status} />
            <span className="text-xs text-muted-foreground">
              Pemilik · {pemilik.tipePemilik}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(session!.user.role, "data:input") && (
            <Link href={`/owners/${idPemilik}/edit`}>
              <Button size="sm" variant="outline">Edit</Button>
            </Link>
          )}
          <ApprovalActions
            type="pemilik"
            id={idPemilik}
            status={pemilik.status}
            role={session!.user.role}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-foreground">Informasi</CardTitle>
            </CardHeader>
            <CardContent>
              <Row label="NIK" value={pemilik.nik} />
              <Row label="NPWP" value={pemilik.npwp} />
              <Row label="Nama Perusahaan" value={pemilik.namaPerusahaan} />
              <Row label="No. HP" value={pemilik.noHp} />
              <Row label="Email" value={pemilik.email} />
              <Row label="Alamat" value={pemilik.alamat} />
              <Row
                label="Kota / Provinsi"
                value={[pemilik.kota, pemilik.provinsi].filter(Boolean).join(" / ")}
              />
              <Row label="Kode Pos" value={pemilik.kodePos} />
              <Row label="Rekening" value={
                pemilik.nomorRekening
                  ? `${pemilik.nomorRekening} (${pemilik.namaBank ?? ""})`
                  : null
              } />
              <Row label="Bergabung" value={formatDate(pemilik.tanggalBergabung)} />
              <Row label="Catatan" value={pemilik.catatan} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base text-foreground">
                Kendaraan ({pemilik.mobils.length})
              </CardTitle>
              <Link href={`/vehicles/new?owner=${idPemilik}`}>
                <Button size="sm">+ Tambah kendaraan</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <Tr>
                    <Th>No. Polisi</Th>
                    <Th>Merk / Tipe</Th>
                    <Th>Operasional</Th>
                    <Th>Approval</Th>
                  </Tr>
                </THead>
                <TBody>
                  {pemilik.mobils.map((m) => (
                    <Tr key={m.idMobil}>
                      <Td className="font-mono text-xs">
                        <Link
                          href={`/vehicles/${m.idMobil}`}
                          className="hover:underline"
                        >
                          {m.noPolisi}
                        </Link>
                      </Td>
                      <Td>
                        {m.merk} <span className="text-muted-foreground">{m.tipe}</span>
                      </Td>
                      <Td className="text-muted-foreground">{m.statusMobil}</Td>
                      <Td><StatusBadge status={m.status} /></Td>
                    </Tr>
                  ))}
                  {pemilik.mobils.length === 0 && (
                    <Tr>
                      <Td colSpan={4} className="py-6 text-center text-muted-foreground">
                        Belum ada kendaraan.
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>

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
