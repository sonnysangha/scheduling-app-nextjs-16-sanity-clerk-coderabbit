"use client"

import { Suspense } from "react"
import { NewUsersCard } from "@/components/admin/insights/NewUsersCard"
import { TotalBookingsCard } from "@/components/admin/insights/TotalBookingsCard"
import { MostBookedDayCard } from "@/components/admin/insights/MostBookedDayCard"
import { TotalMeetingTypesCard } from "@/components/admin/insights/TotalMeetingTypesCard"
import { ConnectedAccountsCard } from "@/components/admin/insights/ConnectedAccountsCard"
import { BookingTrendCard } from "@/components/admin/insights/BookingTrendCard"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

function CardSkeleton() {
  return (
    <Card className="min-h-[120px]">
      <CardContent className="flex items-center justify-center h-full pt-6">
        <Spinner className="size-5" />
      </CardContent>
    </Card>
  )
}


export function InsightsSection() {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">Insights</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Suspense fallback={<CardSkeleton />}>
          <NewUsersCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <TotalBookingsCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <MostBookedDayCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <TotalMeetingTypesCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <ConnectedAccountsCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <BookingTrendCard />
        </Suspense>
      </div>
    </section>
  )
}
