export function HeroVisual() {
  return (
    <div className="mt-16 sm:mt-24">
      <div className="relative mx-auto max-w-5xl">
        <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-2xl" />
        <div className="relative overflow-hidden rounded-xl border bg-zinc-50 shadow-2xl dark:bg-zinc-900">
          <div className="flex items-center gap-2 border-b bg-white px-4 py-3 dark:bg-zinc-950">
            <div className="flex gap-1.5">
              <div className="size-3 rounded-full bg-red-500" />
              <div className="size-3 rounded-full bg-yellow-500" />
              <div className="size-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 text-center text-sm text-zinc-500">
              scheduly.app/availability
            </div>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="space-y-3">
              <div className="h-4 w-24 rounded bg-blue-500/20" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border bg-white p-3 dark:bg-zinc-800"
                  >
                    <div className="size-8 rounded-full bg-blue-500/20" />
                    <div className="space-y-1">
                      <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
                      <div className="h-2 w-16 rounded bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 rounded-lg border bg-white p-4 dark:bg-zinc-800">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="flex gap-2">
                  <div className="h-8 w-20 rounded bg-blue-500/20" />
                  <div className="h-8 w-20 rounded bg-zinc-100 dark:bg-zinc-700" />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded ${
                      [8, 9, 15, 16, 22, 23, 29, 30].includes(i)
                        ? "bg-green-500/30"
                        : [12, 19, 26].includes(i)
                          ? "bg-blue-500/30"
                          : "bg-zinc-100 dark:bg-zinc-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
