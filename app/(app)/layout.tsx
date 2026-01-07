import { SanityLive } from "@/sanity/lib/live";
import { ClerkProvider } from "@clerk/nextjs";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <main>{children}</main>
      <SanityLive />
    </ClerkProvider>
  );
}

export default AppLayout;
