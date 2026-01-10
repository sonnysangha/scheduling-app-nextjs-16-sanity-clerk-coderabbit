"use client"

import { useState, Suspense } from "react"
import { FeedbackList } from "@/components/admin/feedback/FeedbackList"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"

function ListFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <Spinner className="size-5" />
    </div>
  )
}

export function FeedbackSection() {
  const [activeTab, setActiveTab] = useState<string>("new")

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="new" className="flex-1">
              New
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex-1">
              Archived
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            <Suspense fallback={<ListFallback />}>
              <FeedbackList showArchived={false} />
            </Suspense>
          </TabsContent>

          <TabsContent value="archived" className="mt-4">
            <Suspense fallback={<ListFallback />}>
              <FeedbackList showArchived={true} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
