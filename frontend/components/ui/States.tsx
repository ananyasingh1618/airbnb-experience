import Link from "next/link";
import { AlertTriangle, SearchX } from "lucide-react";
import { btn } from "@/components/ui/button";

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  icon?: React.ReactNode;
}) {
  return (
    <div className="anim-fade mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-full bg-surface-2 text-ink-2">
        {icon ?? <SearchX className="size-6" aria-hidden />}
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {body && <p className="mt-2 text-ink-2">{body}</p>}
      {action &&
        (action.href ? (
          <Link href={action.href} className={`${btn("dark")} mt-6`}>
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} className={`${btn("dark")} mt-6`}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-full bg-danger-bg text-danger">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-ink-2">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className={`${btn("dark")} mt-6`}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-danger">
      {children}
    </p>
  );
}
