import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Th, Tr, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatIDR } from "@/lib/utils";

export default async function VehiclesPage() {
  const session = await auth();
  const merchantId = session!.user.merchantId!;

  const mobils = await db.mobil.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    include: { pemilik: { select: { idPemilik: true, nama: true } } },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kendaraan</h1>
        <Link href="/vehicles/new">
          <Button>+ Kendaraan Baru</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            Daftar Kendaraan ({mobils.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <Tr>
                <Th>No. Polisi</Th>
                <Th>Merk / Tipe</Th>
                <Th>Pemilik</Th>
                <Th>Tarif / hari</Th>
                <Th>Pajak</Th>
                <Th>Operasional</Th>
                <Th>Approval</Th>
              </Tr>
            </THead>
            <TBody>
              {mobils.map((m) => (
                <Tr key={m.idMobil}>
                  <Td className="font-mono text-xs">
                    <Link href={`/vehicles/${m.idMobil}`} className="hover:underline">
                      {m.noPolisi}
                    </Link>
                  </Td>
                  <Td>
                    <div className="font-medium">{m.merk}</div>
                    <div className="text-xs text-muted-foreground">{m.tipe}</div>
                  </Td>
                  <Td className="text-muted-foreground">
                    <Link href={`/owners/${m.pemilik.idPemilik}`} className="hover:underline">
                      {m.pemilik.nama}
                    </Link>
                  </Td>
                  <Td className="tabular-nums">
                    {formatIDR(m.hargaSewaHarian ? Number(m.hargaSewaHarian) : null)}
                  </Td>
                  <Td className="text-muted-foreground">{formatDate(m.masaBerlakuPajak)}</Td>
                  <Td><Badge variant="outline">{m.statusMobil}</Badge></Td>
                  <Td><StatusBadge status={m.status} /></Td>
                </Tr>
              ))}
              {mobils.length === 0 && (
                <Tr>
                  <Td colSpan={7} className="text-center text-muted-foreground py-10">
                    Belum ada kendaraan terdaftar.{" "}
                    <Link href="/vehicles/new" className="text-primary hover:underline">
                      Tambahkan kendaraan →
                    </Link>
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
