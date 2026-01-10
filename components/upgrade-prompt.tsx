import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradePromptProps {
  feature: string;
  currentUsage: number;
  limit: number;
  className?: string;
}

export function UpgradePrompt({
  feature,
  currentUsage,
  limit,
  className,
}: UpgradePromptProps) {
  const isAtLimit = currentUsage >= limit;

  return (
    <div
      className={`rounded-lg border bg-muted/50 p-4 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {currentUsage} of {limit} {feature}
          </p>
          {isAtLimit ? (
            <p className="text-sm text-muted-foreground">
              Upgrade your plan to add more
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {limit - currentUsage} remaining on your plan
            </p>
          )}
        </div>
        {isAtLimit && (
          <Button asChild size="sm">
            <Link href="/pricing">
              Upgrade
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

interface UsageBadgeProps {
  current: number;
  limit: number;
  label: string;
}

export function UsageBadge({ current, limit, label }: UsageBadgeProps) {
  const isAtLimit = current >= limit;
  const percentage = Math.min((current / limit) * 100, 100);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className={isAtLimit ? "font-medium text-orange-600" : ""}>
        {current}/{limit === Infinity ? "unlimited" : limit}
      </span>
      {limit !== Infinity && (
        <div className="h-1.5 w-16 rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? "bg-orange-500" : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
