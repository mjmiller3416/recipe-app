import type { Metadata } from "next";
import { SettingsView } from "./_components";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <SettingsView />;
}
