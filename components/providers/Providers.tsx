"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";

const SanityAppProvider = dynamic(
  () => import("@/components/providers/SanityAppProvider"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="size-10" />
      </div>
    ),
  },
);

export function Providers({ children }: { children: React.ReactNode }) {
  return <SanityAppProvider>{children}</SanityAppProvider>;
}
