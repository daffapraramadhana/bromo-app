import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, THead, Th, Tr, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { decideAction } from "./actions";

type Row = {
  type: "pemilik" | "driver" | "mobil";
  id: number;
  label: string;
  sub: string;
  createdAt: Date;
};

export default async function ApprovalsPage() {
  const session = await auth();
  const merchantId = session!.user.merchantId!;
  const canDecide = can(session!.user.role, "data:approve");

  const [pemiliks, drivers, mobils] = await Promise.all([
    db.pemilik.findMany({
      where: { merchantId, status: "pending_approval" },
      orderBy: { createdAt: "asc" },
    }),
    db.driver.findMany({
      where: { merchantId, status: "pending_approval" },
      orderBy: { createdAt: "asc" },
    }),
    db.mobil.findMany({
      where: { merchantId, status: "pending_approval" },
      orderBy: { createdAt: "asc" },
      include: { pemilik: { select: { nama: true } } },
    }),
  ]);

  const rows: Row[] = [
    ...pemiliks.map<Row>((p) => ({
      type: "pemilik",
      id: p.idPemilik,
      label: p.nama,
      sub: `Pemilik · ${p.tipePemilik}`,
      createdAt: p.createdAt,
    })),
    ...drivers.map<Row>((d) => ({
      type: "driver",
      id: d.idDriver,
      label: d.nama,
      sub: `Driver · SIM ${d.jenisSim}`,
      createdAt: d.createdAt,
    })),
    ...mobils.map<Row>((m) => ({
      type: "mobil",
      id: m.idMobil,
      label: `${m.merk} ${m.tipe}`,
      sub: `Kendaraan · ${m.noPolisi} · ${m.pemilik.nama}`,
      createdAt: m.createdAt,
    })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Approval Queue</h1>
        <p className="text-sm text-muted-foreground">
          Data yang diajukan Admin dan menunggu keputusan Manager.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-foreground">
            {rows.length} item menunggu
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <Tr>
                <Th>Subjek</Th>
                <Th>Diajukan</Th>
                {canDecide && <Th className="text-right pr-6">Aksi</Th>}
              </Tr>
            </THead>
            <TBody>
              {rows.map((r) => (
                <Tr key={`${r.type}:${r.id}`}>
                  <Td>
                    <div className="font-medium">{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.sub}</div>
                  </Td>
                  <Td className="text-muted-foreground">{formatDate(r.createdAt)}</Td>
                  {canDecide && (
                    <Td className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <form action={decideAction}>
                          <input type="hidden" name="type" value={r.type} />
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="rejected" />
                          <Button type="submit" size="sm" variant="outline">
                            Tolak
                          </Button>
                        </form>
                        <form action={decideAction}>
                          <input type="hidden" name="type" value={r.type} />
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="decision" value="approved" />
                          <Button type="submit" size="sm">
                            Setujui
                          </Button>
                        </form>
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
              {rows.length === 0 && (
                <Tr>
                  <Td
                    colSpan={canDecide ? 3 : 2}
                    className="text-center text-muted-foreground py-10"
                  >
                    Tidak ada item yang menunggu approval.
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
