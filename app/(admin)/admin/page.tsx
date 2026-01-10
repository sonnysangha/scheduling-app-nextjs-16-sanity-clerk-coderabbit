"use client"

import { Suspense } from "react"
import { InsightsSection } from "@/components/admin/insights/InsightsSection"
import { FeedbackSection } from "@/components/admin/feedback/FeedbackSection"
import { Spinner } from "@/components/ui/spinner"

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Spinner className="size-6" />
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Suspense fallback={<LoadingFallback />}>
            <InsightsSection />
          </Suspense>
        </div>

        <div className="w-full lg:w-96 shrink-0">
          <Suspense fallback={<LoadingFallback />}>
            <FeedbackSection />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
