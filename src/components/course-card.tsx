
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Clock, CalendarDays, BookText, FlaskConical, AlertCircle, MapPin } from "lucide-react";
import type { Course, SectionTime, Day } from "@/lib/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { PASTEL_COLORS } from "@/lib/colors";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

interface CourseCardProps {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onToggleCourse: (courseId: string, isEnabled: boolean) => void;
  onToggleSection: (courseId: string, sectionId: string, isEnabled: boolean) => void;
  onUpdateCourseColor: (courseId: string, newColor: string) => void;
}

const SectionTimeDisplay = ({ sectionTime, type }: { sectionTime: SectionTime, type: 'Lecture' | 'Lab'}) => {
  const { language } = useLanguage();
  const t = translations[language].courseCard;

  const getDayName = (day: Day) => {
    return translations[language].sectionForm.days[day];
  }

  return (
    <div className="space-y-3">
        <h4 className={cn('font-medium text-foreground flex items-center gap-2', language === 'ar' ? 'font-arabic' : '')}>
            {type === 'Lecture' ? <BookText className="h-4 w-4 text-muted-foreground" /> : <FlaskConical className="h-4 w-4 text-muted-foreground" />}
            {t.classTypes[type]}
        </h4>
        <div className="pl-6 space-y-2">
            {sectionTime.times.map((time, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 p-3 rounded-md border bg-background">
                    <div className="flex items-center flex-wrap gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        {time.days.map(day => (
                          <Badge key={day} variant="secondary" className={cn('font-mono', language === 'ar' ? 'font-arabic' : '')}>{getDayName(day)}</Badge>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono">{time.startTime} - {time.endTime}</span>
                    </div>
                    {time.classroom && (
                        <div className="flex items-center gap-2 text-muted-foreground md:col-span-2">
                            <MapPin className="h-4 w-4" />
                            <span>{time.classroom}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
}


export function CourseCard({ course, onEdit, onDelete, onToggleCourse, onToggleSection, onUpdateCourseColor }: CourseCardProps) {
  const { language } = useLanguage();
  const t = translations[language].courseCard;
  
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", !course.isEnabled && "opacity-50")}>
      <CardHeader className="flex flex-row items-start bg-muted/50" dir="ltr">
        <div className="flex-grow min-w-0 pr-4">
          <CardTitle className="flex items-start gap-3">
             <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button className="w-4 h-4 rounded-full border flex-shrink-0 mt-1.5" style={{ backgroundColor: course.color }} aria-label="Change course color" />
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className={language === 'ar' ? 'font-arabic' : ''}>{t.changeColorTooltip}</p>
                  </TooltipContent>
                </Tooltip>
                <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-5 gap-2">
                        {PASTEL_COLORS.map(color => (
                            <button
                                key={color}
                                className={cn("w-6 h-6 rounded-full border", course.color === color && "ring-2 ring-ring ring-offset-2")}
                                style={{ backgroundColor: color }}
                                onClick={() => onUpdateCourseColor(course.id, color)}
                            />
                        ))}
                    </div>
                </PopoverContent>
             </Popover>
            <span className={cn('truncate block', language === 'ar' ? 'font-arabic text-right' : '')}>{course.name}</span>
          </CardTitle>
           <CardDescription className={cn('mt-1 flex items-center gap-4 pl-7', language === 'ar' ? 'font-arabic text-right' : '')}>
                <span>{course.sections.length} {t.sectionsCount}</span>
                {course.finalExamPeriod && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        {t.examPeriod}: {course.finalExamPeriod}
                    </span>
                )}
            </CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="toggle-wrapper">
            <Switch
                checked={course.isEnabled}
                onCheckedChange={(checked) => onToggleCourse(course.id, checked)}
                aria-label={`Toggle course ${course.name}`}
              />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit course ${course.name}`}>
                <Edit className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className={language === 'ar' ? 'font-arabic' : ''}>{t.editTooltip}</p>
            </TooltipContent>
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Delete course ${course.name}`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className={language === 'ar' ? 'font-arabic' : ''}>{t.deleteTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
         <Accordion type="single" collapsible className="w-full" disabled={!course.isEnabled}>
            {course.sections.map((section, index) => (
              <AccordionItem value={`item-${index}`} key={section.id} className={cn(!section.isEnabled && "bg-muted/30 rounded-md px-4", language === 'ar' ? 'font-arabic' : '')}>
                <AccordionTrigger className="rtl:flex-row-reverse">
                  <div className={cn("flex items-center w-full", language === 'ar' ? 'justify-end' : 'justify-between')}>
                    <span className='font-medium'>{section.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2 p-2 justify-end">
                            <Label htmlFor={`section-toggle-${section.id}`} className={cn('text-sm text-muted-foreground', language === 'ar' ? 'font-arabic' : '')}>
                                {section.isEnabled ? t.enabled : t.disabled}
                            </Label>
                            <div className="toggle-wrapper">
                              <Switch
                                  id={`section-toggle-${section.id}`}
                                  checked={section.isEnabled}
                                  onCheckedChange={(checked) => onToggleSection(course.id, section.id, checked)}
                                  disabled={!course.isEnabled}
                              />
                            </div>
                        </div>
                        {section.lecture && <SectionTimeDisplay sectionTime={section.lecture} type="Lecture" />}
                        {section.lab && <SectionTimeDisplay sectionTime={section.lab} type="Lab" />}
                    </div>
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
