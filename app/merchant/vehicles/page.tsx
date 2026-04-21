import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    include: { pemilik: { select: { nama: true } } },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Kendaraan</h1>
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
                  <Td className="font-mono text-xs">{m.noPolisi}</Td>
                  <Td>
                    <div className="font-medium">{m.merk}</div>
                    <div className="text-xs text-muted-foreground">{m.tipe}</div>
                  </Td>
                  <Td className="text-muted-foreground">{m.pemilik.nama}</Td>
                  <Td className="tabular-nums">
                    {formatIDR(m.hargaSewaHarian ? Number(m.hargaSewaHarian) : null)}
                  </Td>
                  <Td className="text-muted-foreground">
                    {formatDate(m.masaBerlakuPajak)}
                  </Td>
                  <Td>
                    <Badge variant="outline">{m.statusMobil}</Badge>
                  </Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                </Tr>
              ))}
              {mobils.length === 0 && (
                <Tr>
                  <Td colSpan={7} className="text-center text-muted-foreground py-8">
                    Belum ada kendaraan terdaftar.
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
