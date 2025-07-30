
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Download, Eye, EyeOff, BookText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ScheduleControlsProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSaveImage: () => void;
  showSectionNames: boolean;
  onToggleShowSectionNames: () => void;
  showClassTypes: boolean;
  onToggleShowClassTypes: () => void;
}

export function ScheduleControls({
  current,
  total,
  onPrev,
  onNext,
  onSaveImage,
  showSectionNames,
  onToggleShowSectionNames,
  showClassTypes,
  onToggleShowClassTypes,
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
                <div className="flex items-center space-x-2">
                    <Switch
                        id="show-class-types"
                        checked={showClassTypes}
                        onCheckedChange={onToggleShowClassTypes}
                    />
                    <Label htmlFor="show-class-types" className="flex items-center gap-2 text-muted-foreground">
                        {showClassTypes && <BookText className="h-4 w-4" />}
                        <span>Class Types</span>
                    </Label>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Toggle the visibility of class types (Lecture/Lab).</p>
            </TooltipContent>
        </Tooltip>

        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex items-center space-x-2">
                    <Switch
                        id="show-section-names"
                        checked={showSectionNames}
                        onCheckedChange={onToggleShowSectionNames}
                    />
                    <Label htmlFor="show-section-names" className="flex items-center gap-2 text-muted-foreground">
                        {!showSectionNames && <EyeOff className="h-4 w-4" />}
                        <span>Section Names</span>
                    </Label>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Toggle the visibility of section names in the schedule.</p>
            </TooltipContent>
        </Tooltip>


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
