"use client"

import { Suspense } from "react"
import { useDocuments } from "@sanity/sdk-react"
import { FeedbackItem } from "@/components/admin/feedback/FeedbackItem"
import { Spinner } from "@/components/ui/spinner"

interface FeedbackListProps {
  showArchived: boolean
}

export function FeedbackList({ showArchived }: FeedbackListProps) {
  const { data: feedbackDocs } = useDocuments({
    documentType: "feedback",
    orderings: [{ field: "_createdAt", direction: "desc" }],
  })

  if (!feedbackDocs || feedbackDocs.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No feedback yet.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 max-h-[60vh] lg:max-h-[500px] overflow-y-auto">
      {feedbackDocs.map((doc) => (
        <Suspense
          key={doc.documentId}
          fallback={
            <div className="p-4 flex items-center justify-center">
              <Spinner className="size-4" />
            </div>
          }
        >
          <FeedbackItem {...doc} showArchived={showArchived} />
        </Suspense>
      ))}
    </div>
  )
}
