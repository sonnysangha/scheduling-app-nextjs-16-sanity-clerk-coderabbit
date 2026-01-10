"use client";

import { useDocuments } from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function NewUsersCard() {
  const { data: users } = useDocuments({
    documentType: "user",
  });

  const totalUsersCount = users?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{totalUsersCount}</p>
      </CardContent>
    </Card>
  );
}
