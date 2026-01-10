"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import {
  useDocuments,
  useDocumentProjection,
  type DocumentHandle,
} from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface UserProjection {
  connectedAccountsCount: number | null;
}

interface AccountCountReporterProps extends DocumentHandle {
  onCount: (documentId: string, count: number) => void;
}

function AccountCountReporter({
  documentId,
  documentType,
  onCount,
}: AccountCountReporterProps) {
  const { data } = useDocumentProjection<UserProjection>({
    documentId,
    documentType,
    projection: `{ "connectedAccountsCount": count(connectedAccounts) }`,
  });

  useEffect(() => {
    if (
      data?.connectedAccountsCount !== null &&
      data?.connectedAccountsCount !== undefined
    ) {
      onCount(documentId, data.connectedAccountsCount);
    }
  }, [data?.connectedAccountsCount, documentId, onCount]);

  return null;
}

export function ConnectedAccountsCard() {
  const { data: users } = useDocuments({
    documentType: "user",
  });

  const [countMap, setCountMap] = useState<Record<string, number>>({});

  const handleCount = useCallback((documentId: string, count: number) => {
    setCountMap((prev) => {
      if (prev[documentId] === count) return prev;
      return { ...prev, [documentId]: count };
    });
  }, []);

  const totalConnected = Object.values(countMap).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Google Calendars Linked
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{totalConnected}</p>
      </CardContent>
      {users?.map((user) => (
        <Suspense key={user.documentId} fallback={null}>
          <AccountCountReporter {...user} onCount={handleCount} />
        </Suspense>
      ))}
    </Card>
  );
}
