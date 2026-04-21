import { addDays } from "date-fns";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";

export default async function MerchantDashboard() {
  const session = await auth();
  const merchantId = session!.user.merchantId!;
  const in30 = addDays(new Date(), 30);

  const [
    pendingApprovals,
    activeVehicles,
    driversOnDuty,
    expiringSim,
    expiringPajak,
    recentLogs,
  ] = await Promise.all([
    db.pemilik.count({ where: { merchantId, status: "pending_approval" } }),
    db.mobil.count({ where: { merchantId, statusMobil: "tersedia", status: "approved" } }),
    db.driver.count({ where: { merchantId, statusDriver: "bertugas" } }),
    db.driver.count({
      where: { merchantId, masaBerlakuSim: { lte: in30 } },
    }),
    db.mobil.count({
      where: { merchantId, masaBerlakuPajak: { lte: in30 } },
    }),
    db.approvalLog.findMany({
      where: { merchantId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  const attention = pendingApprovals + expiringSim + expiringPajak;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan operasional hari ini.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Perlu Perhatian"
          value={attention}
          hint="Pending approval + dokumen kadaluarsa ≤30 hari"
          intent={attention > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Kendaraan Aktif"
          value={activeVehicles}
          hint="Disetujui & tersedia"
        />
        <KpiCard
          label="Driver Bertugas"
          value={driversOnDuty}
        />
        <KpiCard
          label="Menunggu Approval"
          value={pendingApprovals}
          intent={pendingApprovals > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground text-base">
              Dokumen Segera Kadaluarsa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SIM driver ≤ 30 hari</span>
              <span className="font-medium tabular-nums">{expiringSim}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pajak kendaraan ≤ 30 hari</span>
              <span className="font-medium tabular-nums">{expiringPajak}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground text-base">
              Aktivitas Approval Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada aktivitas.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentLogs.map((log) => (
                  <li key={log.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate">
                        <span className="text-muted-foreground">
                          {log.actor.name ?? log.actor.email}
                        </span>{" "}
                        {log.action} {log.approvableType}#{log.approvableId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </div>
                    </div>
                    <StatusBadge status={log.toStatus} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
