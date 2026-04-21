import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Th, Tr, Td } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function UsersPage() {
  const session = await auth();
  const merchantId = session!.user.merchantId!;

  const users = await db.user.findMany({
    where: { merchantId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users & Roles</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            Anggota ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <Tr>
                <Th>Nama</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Dibuat</Th>
              </Tr>
            </THead>
            <TBody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium">{u.name ?? "—"}</Td>
                  <Td className="text-muted-foreground">{u.email}</Td>
                  <Td>
                    <Badge variant="outline">{u.role}</Badge>
                  </Td>
                  <Td className="text-muted-foreground">
                    {formatDate(u.createdAt)}
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
