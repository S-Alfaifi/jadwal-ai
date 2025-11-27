
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Download, Eye, EyeOff, BookText, MapPin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

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
  showClassroom: boolean;
  onToggleShowClassroom: () => void;
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
  showClassroom,
  onToggleShowClassroom,
}: ScheduleControlsProps) {
  const { language } = useLanguage();
  const t = translations[language].scheduleControls;

  const ToggleItem = ({ id, checked, onCheckedChange, icon: Icon, label, tooltip }: { id: string, checked: boolean, onCheckedChange: () => void, icon: React.ElementType, label: string, tooltip: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
                <div className="toggle-wrapper">
                  <Switch
                      id={id}
                      checked={checked}
                      onCheckedChange={onCheckedChange}
                  />
                </div>
                <Label htmlFor={id} className={cn('flex items-center gap-2 text-foreground', language === 'ar' && 'font-arabic')}>
                   <Icon className="h-4 w-4" />
                    <span>{label}</span>
                </Label>
            </div>
        </TooltipTrigger>
        <TooltipContent>
            <p className={language === 'ar' ? 'font-arabic' : ''}>{tooltip}</p>
        </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 rounded-lg bg-card border" dir="ltr">
      <div>
        <h2 className={cn('text-2xl font-headline font-bold text-foreground', language === 'ar' && 'font-arabic text-3xl text-right')}>
          {t.title}
        </h2>
      </div>
      <div className="flex items-center gap-4 flex-wrap justify-center">

        <ToggleItem
          id="show-classroom"
          checked={showClassroom}
          onCheckedChange={onToggleShowClassroom}
          icon={MapPin}
          label={t.toggles.classroom}
          tooltip={t.tooltips.classroom}
        />
        
        <ToggleItem
          id="show-class-types"
          checked={showClassTypes}
          onCheckedChange={onToggleShowClassTypes}
          icon={BookText}
          label={t.toggles.classTypes}
          tooltip={t.tooltips.classTypes}
        />

        <ToggleItem
          id="show-section-names"
          checked={showSectionNames}
          onCheckedChange={onToggleShowSectionNames}
          icon={showSectionNames ? Eye : EyeOff}
          label={t.toggles.sectionNames}
          tooltip={t.tooltips.sectionNames}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onSaveImage}>
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className={language === 'ar' ? 'font-arabic' : ''}>{t.tooltips.saveImage}</p>
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
                    <p className={language === 'ar' ? 'font-arabic' : ''}>{t.tooltips.previous}</p>
                </TooltipContent>
            </Tooltip>
             {total > 0 && (
                <p className={cn('text-sm text-muted-foreground tabular-nums', language === 'ar' && 'font-arabic')}>
                    {t.displaying} {current} {t.of} {total}
                </p>
            )}
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onNext} disabled={total <= 1}>
                    <ArrowRight className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className={language === 'ar' ? 'font-arabic' : ''}>{t.tooltips.next}</p>
                </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}
