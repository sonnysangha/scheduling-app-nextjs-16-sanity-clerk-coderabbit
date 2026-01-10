import Link from "next/link";
import { Calendar } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t bg-white py-12 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500">
                <Calendar className="size-4 text-white" />
              </div>
              <span className="font-bold text-zinc-900 dark:text-white">
                Calvero
              </span>
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Pricing
            </Link>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Built with Next.js, Sanity, and Clerk
          </p>
        </div>
      </div>
    </footer>
  );
}
