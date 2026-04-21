import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Th, Tr, Td } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function MerchantsPage() {
  const merchants = await db.merchant.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true, mobils: true, drivers: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Merchants</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            {merchants.length} merchant terdaftar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <Tr>
                <Th>Nama</Th>
                <Th>Slug</Th>
                <Th>Users</Th>
                <Th>Kendaraan</Th>
                <Th>Driver</Th>
                <Th>Dibuat</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {merchants.map((m) => (
                <Tr key={m.id}>
                  <Td className="font-medium">{m.name}</Td>
                  <Td className="font-mono text-xs text-muted-foreground">
                    {m.slug}
                  </Td>
                  <Td className="tabular-nums">{m._count.users}</Td>
                  <Td className="tabular-nums">{m._count.mobils}</Td>
                  <Td className="tabular-nums">{m._count.drivers}</Td>
                  <Td className="text-muted-foreground">
                    {formatDate(m.createdAt)}
                  </Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
