const steps = [
  {
    number: "01",
    title: "Set Your Availability",
    description:
      "Use the visual calendar to drag and create time blocks when you're free to meet. Connect your Google Calendar to automatically block busy times.",
  },
  {
    number: "02",
    title: "Create Meeting Types",
    description:
      "Define different meeting types like consultations, quick chats, or discovery calls. Set custom durations for each type.",
  },
  {
    number: "03",
    title: "Share Your Link",
    description:
      "Share your personalized booking link. Guests select a meeting type, pick an available slot in their timezone, and book instantly.",
  },
  {
    number: "04",
    title: "Meet with Confidence",
    description:
      "Receive booking confirmations with auto-generated Google Meet links. Track attendee responses and manage all your bookings in one place.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-zinc-50 py-20 sm:py-32 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            How Calvero works
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Get up and running in minutes. No complicated setup required.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2">
          {steps.map((step) => (
            <div key={step.number} className="relative flex gap-6">
              <div className="flex flex-col items-center">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white">
                  {step.number}
                </div>
                <div className="mt-2 h-full w-px bg-blue-200 dark:bg-blue-800" />
              </div>
              <div className="pb-12">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
