import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Explorin — Dashboard",
  description: "Platform manajemen jeep wisata Bromo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
