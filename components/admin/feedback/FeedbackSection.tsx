"use client"

import { useState, Suspense } from "react"
import { FeedbackList } from "@/components/admin/feedback/FeedbackList"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { MessageSquareTextIcon, InboxIcon, ArchiveIcon } from "lucide-react"

function ListFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner className="size-5 text-amber-500" />
    </div>
  )
}

export function FeedbackSection() {
  const [activeTab, setActiveTab] = useState<string>("new")

  return (
    <Card className="h-full bg-white/80 backdrop-blur-sm border-zinc-200/60 shadow-sm animate-in fade-in slide-in-from-right-4 duration-500 delay-150">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/80 text-amber-700 shadow-sm">
            <MessageSquareTextIcon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-zinc-900">Feedback</CardTitle>
            <p className="text-xs text-zinc-500">User suggestions & comments</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-zinc-100/80 p-1">
            <TabsTrigger 
              value="new" 
              className="flex-1 gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <InboxIcon className="size-4" />
              New
            </TabsTrigger>
            <TabsTrigger 
              value="archived" 
              className="flex-1 gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <ArchiveIcon className="size-4" />
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
