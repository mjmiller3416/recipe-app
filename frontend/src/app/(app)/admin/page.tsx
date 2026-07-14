import type { Metadata } from "next";
import { AdminView } from "./_components/AdminView";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return <AdminView />;
}
