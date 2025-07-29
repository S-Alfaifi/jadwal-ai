import { CalendarCheck2 } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <CalendarCheck2 className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold font-headline tracking-tight text-primary-foreground">
        Jadwal.Ai
      </span>
    </div>
  );
}
