
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Columns } from "lucide-react";

interface ScheduleControlsProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  disableSemesterSplit?: boolean;
}

export function ScheduleControls({
  current,
  total,
  onPrev,
  onNext,
  disableSemesterSplit,
}: ScheduleControlsProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 rounded-lg bg-card border">
      <div>
        <h2 className="text-2xl font-headline font-bold">Generated Schedule</h2>
        {total > 0 && (
          <p className="text-muted-foreground">
            Displaying alternative {current} of {total}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {total > 1 && (
          <>
            <Button variant="outline" size="icon" onClick={onPrev} disabled={total <= 1}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onNext} disabled={total <= 1}>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
