"use client"

import {
  useDocument,
  useDocumentProjection,
  useEditDocument,
  type DocumentHandle,
} from "@sanity/sdk-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card"
import { CheckIcon, ArchiveRestoreIcon } from "lucide-react"

interface FeedbackDisplayData {
  content: string | null
  userName: string | null
  userEmail: string | null
}

interface FeedbackItemProps extends DocumentHandle {
  showArchived: boolean
}

export function FeedbackItem({ documentId, documentType, showArchived }: FeedbackItemProps) {
  // Use useDocument for archived field - supports optimistic updates
  const { data: isArchived } = useDocument<boolean>({
    documentId,
    documentType,
    path: "archived",
  })

  // Use useDocumentProjection for display-only fields
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

  // Client-side filter for optimistic updates
  if (showArchived && !archived) return null
  if (!showArchived && archived) return null

  const handleArchiveToggle = () => {
    editArchived(!archived)
  }

  return (
    <Card className={`py-4 ${archived ? "bg-muted/50" : ""}`}>
      <CardHeader className="gap-1.5">
        <CardTitle className="text-base font-medium leading-snug">{displayData.content}</CardTitle>
        <CardDescription className="text-xs">
          {displayData.userName ?? "Unknown"} · {displayData.userEmail ?? ""}
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleArchiveToggle}
            className={archived
              ? ""
              : "text-green-600 hover:text-green-700 hover:bg-green-100"
            }
          >
            {archived ? (
              <ArchiveRestoreIcon className="size-5" />
            ) : (
              <CheckIcon className="size-5" />
            )}
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
