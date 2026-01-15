// Minimal layout - bypasses AppLayout entirely for isolated testing
export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
