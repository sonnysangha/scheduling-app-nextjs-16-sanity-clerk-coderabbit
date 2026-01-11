"use client"

import { Suspense } from "react"
import { useDocuments } from "@sanity/sdk-react"
import { FeedbackItem } from "@/components/admin/feedback/FeedbackItem"
import { Spinner } from "@/components/ui/spinner"
import { InboxIcon } from "lucide-react"

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
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <InboxIcon className="size-10 mb-3 opacity-50" />
        <p className="text-sm font-medium">No feedback yet</p>
        <p className="text-xs">User feedback will appear here</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 max-h-[50vh] lg:max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">
      {feedbackDocs.map((doc, index) => (
        <Suspense
          key={doc.documentId}
          fallback={
            <div className="p-4 flex items-center justify-center">
              <Spinner className="size-4 text-amber-500" />
            </div>
          }
        >
          <div 
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <FeedbackItem {...doc} showArchived={showArchived} />
          </div>
        </Suspense>
      ))}
    </div>
  )
}
