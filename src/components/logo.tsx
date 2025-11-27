import { CalendarCheck2 } from "lucide-react";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
      <CalendarCheck2 className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold font-headline tracking-tight text-foreground">
        Jadwal.Ai
      </span>
    </Link>
  );
}
