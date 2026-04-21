import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Th, Tr, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function DriversPage() {
  const session = await auth();
  const merchantId = session!.user.merchantId!;

  const drivers = await db.driver.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Driver</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            Daftar Driver ({drivers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <Tr>
                <Th>Nama</Th>
                <Th>SIM</Th>
                <Th>Tipe</Th>
                <Th>Status</Th>
                <Th>SIM Berlaku</Th>
                <Th>Approval</Th>
              </Tr>
            </THead>
            <TBody>
              {drivers.map((d) => (
                <Tr key={d.idDriver}>
                  <Td className="font-medium">{d.nama}</Td>
                  <Td className="font-mono text-xs">
                    {d.jenisSim} · {d.noSim}
                  </Td>
                  <Td className="text-muted-foreground">{d.tipeDriver}</Td>
                  <Td>
                    <Badge variant="outline">{d.statusDriver}</Badge>
                  </Td>
                  <Td className="text-muted-foreground">
                    {formatDate(d.masaBerlakuSim)}
                  </Td>
                  <Td>
                    <StatusBadge status={d.status} />
                  </Td>
                </Tr>
              ))}
              {drivers.length === 0 && (
                <Tr>
                  <Td colSpan={6} className="text-center text-muted-foreground py-8">
                    Belum ada driver terdaftar.
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
