import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Th, Tr, Td } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const merchantId = session!.user.merchantId!;
  const { status } = await searchParams;

  const pemiliks = await db.pemilik.findMany({
    where: {
      merchantId,
      ...(status && ["draft", "pending_approval", "approved", "rejected"].includes(status)
        ? { status: status as "draft" | "pending_approval" | "approved" | "rejected" }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Pemilik</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            Daftar Pemilik ({pemiliks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <Tr>
                <Th>Nama</Th>
                <Th>Tipe</Th>
                <Th>Kontak</Th>
                <Th>Bergabung</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {pemiliks.map((p) => (
                <Tr key={p.idPemilik}>
                  <Td className="font-medium">{p.nama}</Td>
                  <Td className="text-muted-foreground">{p.tipePemilik}</Td>
                  <Td className="text-muted-foreground">{p.noHp ?? "—"}</Td>
                  <Td className="text-muted-foreground">
                    {formatDate(p.tanggalBergabung)}
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                </Tr>
              ))}
              {pemiliks.length === 0 && (
                <Tr>
                  <Td colSpan={5} className="text-center text-muted-foreground py-8">
                    Belum ada pemilik terdaftar.
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
