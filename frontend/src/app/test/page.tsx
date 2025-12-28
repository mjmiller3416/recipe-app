export default function TestPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2">Test Page</h1>
      <p className="text-muted mb-8">
        Use this page to test new features and components
      </p>

      {/* Test Section 1 */}
      <section className="bg-elevated rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Test Area 1
        </h2>
        <div className="space-y-4">
          <p className="text-muted">Add your test components here...</p>
        </div>
      </section>

      {/* Test Section 2 */}
      <section className="bg-elevated rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Test Area 2
        </h2>
        <div className="space-y-4">
          <p className="text-muted">Add more test components here...</p>
        </div>
      </section>

      {/* Test Section 3 */}
      <section className="bg-elevated rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Test Area 3
        </h2>
        <div className="space-y-4">
          <p className="text-muted">Additional test area...</p>
        </div>
      </section>
    </div>
  );
}