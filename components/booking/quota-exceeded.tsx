import { CalendarOff } from "lucide-react";

interface QuotaExceededProps {
  hostName: string;
}

export function QuotaExceeded({ hostName }: QuotaExceededProps) {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <div className="rounded-xl border bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <CalendarOff className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>

          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Booking Temporarily Unavailable
          </h1>

          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {hostName} has reached their monthly booking limit.
          </p>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-500">
            Please contact them directly or try again next month.
          </p>
        </div>
      </div>
    </main>
  );
}
