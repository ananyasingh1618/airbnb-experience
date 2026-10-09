"use client";

import { Briefcase } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/States";
import { useDemoUser } from "@/lib/demo-user";

/** Renders children only for a host demo account; otherwise offers the host accounts to switch to. */
export function HostGate({ children }: { children: (host: NonNullable<ReturnType<typeof useDemoUser>["user"]>) => React.ReactNode }) {
  const { user, users, ready, switchTo } = useDemoUser();
  if (!ready) return null;
  if (user?.role === "host") return <>{children(user)}</>;
  return (
    <div className="mx-auto max-w-lg px-4 pb-10">
      <EmptyState icon={<Briefcase className="size-6" />} title="Switch to a host account" body="The host dashboard is available to host demo accounts. Pick one to continue — this is a demo switch, not a real sign-in." />
      <div className="space-y-2">
        {users.filter((u) => u.role === "host").map((u) => (
          <button key={u.id} onClick={() => switchTo(u.id)} className="flex w-full items-center gap-3 rounded-xl border border-line p-3 text-left transition-colors hover:border-ink">
            <Avatar name={u.name} src={u.avatar_url} size={40} />
            <span><span className="block font-medium">Continue as {u.name}</span><span className="block text-sm text-ink-2">Host</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}
