import Link from "next/link";
import { Badge } from "@/app/_components/primitive/badge";
import { ResetDemoButton } from "@/app/_components/reset-demo/reset-demo-button";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="font-semibold">
          Ottodot Trial Booking
        </Link>
        <Badge tone="warning">Sandbox</Badge>
        <nav className="flex gap-4 text-sm text-muted">
          <Link href="/" className="hover:text-foreground">
            Book
          </Link>
          <Link href="/classes" className="hover:text-foreground">
            Rosters
          </Link>
        </nav>
        <div className="ml-auto">
          <ResetDemoButton />
        </div>
      </div>
    </header>
  );
}
