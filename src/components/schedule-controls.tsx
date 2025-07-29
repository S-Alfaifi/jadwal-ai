
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Download } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ScheduleControlsProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSaveImage: () => void;
}

export function ScheduleControls({
  current,
  total,
  onPrev,
  onNext,
  onSaveImage
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
      <div className="flex items-center gap-4 flex-wrap justify-center">

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onSaveImage}>
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save Schedule as Image</p>
          </TooltipContent>
        </Tooltip>

        {total > 1 && (
          <div className="flex items-center gap-2">
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onPrev} disabled={total <= 1}>
                    <ArrowLeft className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Previous Schedule</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onNext} disabled={total <= 1}>
                    <ArrowRight className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Next Schedule</p>
                </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}
