import { Calendar, Link2, Shield, Users, Video } from "lucide-react";

const integrationFeatures = [
  { icon: Shield, text: "Secure OAuth 2.0 authentication" },
  { icon: Users, text: "Multiple Google accounts support" },
  { icon: Video, text: "Auto-generated Google Meet links" },
  { icon: Link2, text: "Real-time attendee status tracking" },
];

const calendarEvents = [
  { time: "9:00 AM", event: "Team Standup", color: "blue" },
  { time: "11:00 AM", event: "Client Call", color: "green" },
  { time: "2:00 PM", event: "Available", color: "emerald" },
  { time: "4:00 PM", event: "Review Meeting", color: "purple" },
];

function getColorClass(color: string) {
  switch (color) {
    case "blue":
      return "bg-blue-500";
    case "green":
      return "bg-green-500";
    case "emerald":
      return "bg-emerald-500";
    case "purple":
      return "bg-purple-500";
    default:
      return "bg-zinc-500";
  }
}

export function IntegrationSection() {
  return (
    <section className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
              Seamless Google Calendar integration
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Connect multiple Google accounts and let Calvero do the heavy
              lifting. Your busy times are automatically blocked, and new
              bookings create calendar events with video links.
            </p>
            <ul className="mt-8 space-y-4">
              {integrationFeatures.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.text} className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-green-500/10">
                      <Icon className="size-4 text-green-600" />
                    </div>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {item.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-green-500/10 blur-xl" />
            <div className="relative overflow-hidden rounded-xl border bg-white p-6 shadow-lg dark:bg-zinc-800">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500">
                  <Calendar className="size-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white">
                    Google Calendar
                  </div>
                  <div className="text-sm text-green-600">Connected</div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {calendarEvents.map((slot) => (
                  <div
                    key={slot.time}
                    className="flex items-center gap-3 rounded-lg border bg-zinc-50 p-3 dark:bg-zinc-900"
                  >
                    <div className={`size-2 rounded-full ${getColorClass(slot.color)}`} />
                    <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {slot.time}
                    </div>
                    <div className="text-sm text-zinc-900 dark:text-white">
                      {slot.event}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
