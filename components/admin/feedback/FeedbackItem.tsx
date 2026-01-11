"use client"

import {
  useDocument,
  useDocumentProjection,
  useEditDocument,
  type DocumentHandle,
} from "@sanity/sdk-react"
import { Button } from "@/components/ui/button"
import { CheckIcon, ArchiveRestoreIcon } from "lucide-react"

interface FeedbackDisplayData {
  content: string | null
  userName: string | null
  userEmail: string | null
}

interface FeedbackItemProps extends DocumentHandle {
  showArchived: boolean
}

function getInitials(name: string | null): string {
  if (!name) return "?"
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function FeedbackItem({ documentId, documentType, showArchived }: FeedbackItemProps) {
  const { data: isArchived } = useDocument<boolean>({
    documentId,
    documentType,
    path: "archived",
  })

  const { data: displayData } = useDocumentProjection<FeedbackDisplayData>({
    documentId,
    documentType,
    projection: `{
      content,
      "userName": user->name,
      "userEmail": user->email
    }`,
  })

  const editArchived = useEditDocument({
    documentId,
    documentType,
    path: "archived",
  })

  if (!displayData) return null

  const archived = isArchived ?? false

  if (showArchived && !archived) return null
  if (!showArchived && archived) return null

  const handleArchiveToggle = () => {
    editArchived(!archived)
  }

  return (
    <div className={`group relative flex gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
      archived 
        ? "bg-zinc-50 border-zinc-200/60 opacity-70" 
        : "bg-white border-zinc-200/60 hover:border-amber-200"
    }`}>
      {/* Avatar */}
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-semibold shadow-sm">
        {getInitials(displayData.userName)}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-800 leading-relaxed line-clamp-2">
          {displayData.content}
        </p>
        <p className="text-xs text-zinc-400 mt-1.5 truncate">
          {displayData.userName ?? "Unknown"}
          {displayData.userEmail && (
            <span className="text-zinc-300"> · {displayData.userEmail}</span>
          )}
        </p>
      </div>
      
      {/* Action Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleArchiveToggle}
        className={`shrink-0 size-8 opacity-0 group-hover:opacity-100 transition-opacity ${
          archived
            ? "text-zinc-500 hover:text-amber-600 hover:bg-amber-50"
            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
        }`}
      >
        {archived ? (
          <ArchiveRestoreIcon className="size-4" />
        ) : (
          <CheckIcon className="size-4" />
        )}
      </Button>
    </div>
  )
}
