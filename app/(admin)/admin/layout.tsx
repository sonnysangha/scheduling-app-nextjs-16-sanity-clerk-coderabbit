import { Providers } from "@/components/providers/Providers";
import { AdminHeader } from "@/components/admin/AdminHeader";

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <AdminHeader />
        <div className="flex flex-1">
          {children}
        </div>
      </div>
    </Providers>
  );
}

export default AdminLayout;
