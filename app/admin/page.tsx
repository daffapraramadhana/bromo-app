import { db } from "@/lib/db";
import { KpiCard } from "@/components/kpi-card";

export default async function AdminDashboard() {
  const [
    totalMerchants,
    pendingMerchants,
    totalVehicles,
    totalDrivers,
  ] = await Promise.all([
    db.merchant.count(),
    db.merchant.count({ where: { status: "pending_approval" } }),
    db.mobil.count({ where: { status: "approved" } }),
    db.driver.count({ where: { status: "approved" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan seluruh merchant Explorin.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Merchants" value={totalMerchants} />
        <KpiCard
          label="Menunggu Persetujuan"
          value={pendingMerchants}
          intent={pendingMerchants > 0 ? "warning" : "default"}
        />
        <KpiCard label="Kendaraan Aktif" value={totalVehicles} />
        <KpiCard label="Driver Aktif" value={totalDrivers} />
      </div>
    </div>
  );
}
