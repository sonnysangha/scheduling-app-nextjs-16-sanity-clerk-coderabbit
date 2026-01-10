import {
  Calendar,
  CalendarCheck,
  Clock,
  Globe,
  Video,
  Zap,
} from "lucide-react";
import { FeatureCard } from "./feature-card";

const features = [
  {
    icon: Calendar,
    title: "Smart Availability",
    description:
      "Set your availability with an intuitive drag-and-drop calendar. Create time blocks visually and let Calvero handle the rest.",
  },
  {
    icon: Video,
    title: "Google Calendar Sync",
    description:
      "Connect multiple Google accounts to automatically sync busy times and prevent double bookings across all your calendars.",
  },
  {
    icon: Zap,
    title: "Instant Google Meet",
    description:
      "Every booking automatically generates a Google Meet link. No manual setup required for your video meetings.",
  },
  {
    icon: Clock,
    title: "Flexible Meeting Types",
    description:
      "Create different meeting types with custom durations. Quick 15-minute chats or deep 90-minute consultations.",
  },
  {
    icon: Globe,
    title: "Timezone Intelligence",
    description:
      "Automatic timezone detection shows guests availability in their local time. No confusion, no missed meetings.",
  },
  {
    icon: CalendarCheck,
    title: "Real-Time Updates",
    description:
      "Track booking status with live attendee responses. See who accepted, declined, or is still deciding.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Everything you need to manage your schedule
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Powerful features designed to eliminate scheduling friction and
            help you focus on what matters.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
