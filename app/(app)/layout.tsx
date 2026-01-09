import { ClerkProvider } from "@clerk/nextjs";
import { AppHeader } from "@/components/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
    </ClerkProvider>
  );
}
