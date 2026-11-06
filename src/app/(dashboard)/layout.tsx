import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto p-2.5 sm:p-6 lg:p-8 flex-1 pb-20 md:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
