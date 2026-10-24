import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = { title: "Gallery Admin | Art Gallery" };

export default function AdminPage() {
  return (
    <main className="admin-main">
      <AdminDashboard />
    </main>
  );
}
