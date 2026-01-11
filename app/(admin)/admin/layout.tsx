import { Providers } from "@/components/providers/Providers";
import { AdminHeader } from "@/components/admin/AdminHeader";

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-white">
        <AdminHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </Providers>
  );
}

export default AdminLayout;
