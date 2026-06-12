import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

export function ErrorBanner({
  message,
  retryable,
  onRetry,
}: {
  message: string;
  retryable?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border-l-[3px] border-danger bg-danger/5 p-4">
      <AlertTriangle className="text-danger shrink-0 mt-0.5" size={18} />
      <div className="flex-1">
        <p className="text-sm text-ink">{message}</p>
        {retryable && onRetry && (
          <Button variant="secondary" size="md" className="mt-3" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export default ErrorBanner;
