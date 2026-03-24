import { Navigation } from "@/components/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 overflow-x-hidden">
      <Navigation />
      <main className="container mx-auto px-3 sm:px-4 py-5 sm:py-8 max-w-full">
        {children}
      </main>
    </div>
  );
}
