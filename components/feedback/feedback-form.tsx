"use client";

import { useState, useTransition } from "react";
import { MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { submitFeedback } from "@/lib/actions/feedback";

export function FeedbackForm() {
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!content.trim()) return;

    startTransition(async () => {
      await submitFeedback(content);
      setSubmitted(true);
      setContent("");

      setTimeout(() => {
        setSubmitted(false);
      }, 3000);
    });
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
          <p className="text-xl font-semibold">Thanks for your feedback!</p>
          <p className="text-muted-foreground mt-1">We appreciate you taking the time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-blue-100">
          <MessageSquare className="size-7 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-semibold">Feature Feedback</CardTitle>
        <CardDescription className="text-base mt-2">
          What features would you like to see? Let us know how we can make
          Calvero better for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <Textarea
          placeholder="I'd love to see a feature that..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
        <Button
          onClick={handleSubmit}
          disabled={isPending || !content.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-5"
        >
          {isPending ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardContent>
    </Card>
  );
}
