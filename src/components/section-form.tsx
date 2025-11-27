
"use client";

import React, { useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowLeft, FlaskConical, BookText } from "lucide-react";
import type { Section, Day } from "@/lib/types";
import { ALL_DAYS } from "@/lib/types";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "./ui/card";

const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const doTimesConflict = (
  days1: Day[],
  start1Str: string,
  end1Str: string,
  days2: Day[],
  start2Str: string,
  end2Str: string
): boolean => {
  if (!start1Str || !end1Str || !start2Str || !end2Str || !days1 || !days2) return false;
  const commonDays = days1.filter((day) => days2.includes(day));
  if (commonDays.length === 0) return false;

  const start1 = timeToMinutes(start1Str);
  const end1 = timeToMinutes(end1Str);
  const start2 = timeToMinutes(start2Str);
  const end2 = timeToMinutes(end2Str);

  return start1 < end2 && start2 < end1;
};

const createSectionFormSchema = (t: typeof translations[keyof typeof translations]['sectionForm']) => {
  const classTimeSchema = z
    .object({
      days: z
        .array(z.enum(ALL_DAYS))
        .min(1, { message: t.errors.atLeastOneDay }),
      startTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, t.errors.invalidTime),
      endTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, t.errors.invalidTime),
      classroom: z.string().optional(),
    })
    .refine(
      (data) => timeToMinutes(data.startTime) < timeToMinutes(data.endTime),
      {
        message: t.errors.endTimeAfterStart,
        path: ["endTime"],
      }
    );

  const sectionTimeSchema = z
    .object({
      times: z.array(classTimeSchema).min(1, t.errors.atLeastOneTimeslot),
    })
    .superRefine((data, ctx) => {
      for (let i = 0; i < data.times.length; i++) {
        for (let j = i + 1; j < data.times.length; j++) {
          const time1 = data.times[i];
          const time2 = data.times[j];
          if (
            doTimesConflict(
              time1.days,
              time1.startTime,
              time1.endTime,
              time2.days,
              time2.startTime,
              time2.endTime
            )
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t.errors.selfConflict.replace('%j', String(j + 1)).replace('%i', String(i + 1)),
              path: ["times", j, "startTime"],
            });
          }
        }
      }
    });

  return z
    .object({
      id: z.string(),
      name: z.string().min(1, t.sectionNameLabel),
      lecture: sectionTimeSchema.optional(),
      lab: sectionTimeSchema.optional(),
      isEnabled: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (!data.lecture && !data.lab) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t.errors.noLectureOrLab,
          path: ["name"],
        });
      }
      if (data.lecture && data.lab) {
        for (let i = 0; i < data.lecture.times.length; i++) {
          for (let j = 0; j < data.lab.times.length; j++) {
            const lecTime = data.lecture.times[i];
            const labTime = data.lab.times[j];
            if (
              doTimesConflict(
                lecTime.days,
                lecTime.startTime,
                lecTime.endTime,
                labTime.days,
                labTime.startTime,
                labTime.endTime
              )
            ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t.errors.lectureLabConflict.replace('%j', String(j + 1)).replace('%i', String(i + 1)),
                path: ["lab", "times", j, "startTime"],
              });
               ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t.errors.lectureLabConflict.replace('%i', String(i + 1)).replace('%j', String(j + 1)),
                path: ["lecture", "times", i, "startTime"],
              });
            }
          }
        }
      }
    });
};



interface SectionFormProps {
  onSave: (data: Section) => void;
  onBack: () => void;
  onCancel: () => void;
  section?: Section | null;
}

const SectionTimeFields = ({
  control,
  type,
  errors,
}: {
  control: any;
  type: "lecture" | "lab";
  errors: any;
}) => {
  const { language } = useLanguage();
  const t = translations[language].sectionForm;
  const {
    fields: timeFields,
    append: appendTime,
    remove: removeTime,
  } = useFieldArray({
    control,
    name: `${type}.times` as const,
  });

  const getDayName = (day: Day) => t.days[day];

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-4">
        <CardTitle
          className={cn(
            "text-lg font-semibold flex items-center gap-3",
            language === "ar" ? "font-arabic" : ""
          )}
        >
          {type === "lecture" ? (
            <BookText className="h-5 w-5 text-muted-foreground" />
          ) : (
            <FlaskConical className="h-5 w-5 text-muted-foreground" />
          )}
          {t.classTypes[type]}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={cn(
          "flex-grow p-6 pt-0 space-y-4",
          type === "lab" && "overflow-y-auto"
        )}
      >
        <div className="space-y-4">
          {timeFields.map((timeField, timeIndex) => (
            <div
              key={timeField.id}
              className="p-4 border rounded-lg bg-background relative space-y-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <Label className="font-semibold text-foreground">
                  {t.timeSlot} #{timeIndex + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTime(timeIndex)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label
                  className={cn(
                    "text-sm",
                    language === "ar" ? "font-arabic" : ""
                  )}
                >
                  {t.daysLabel}
                </Label>
                <Controller
                  control={control}
                  name={`${type}.times.${timeIndex}.days`}
                  render={({ field }) => (
                    <ToggleGroup
                      type="multiple"
                      variant="outline"
                      size="sm"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-5 gap-2"
                    >
                      {ALL_DAYS.map((day) => (
                        <ToggleGroupItem
                          key={day}
                          value={day}
                          aria-label={getDayName(day)}
                          className={cn(
                            "h-9 text-xs",
                            language === "ar" ? "font-arabic" : ""
                          )}
                        >
                          {getDayName(day)}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  )}
                />
                {errors?.[type]?.times?.[timeIndex]?.days && (
                  <p className="text-sm text-destructive mt-1">
                    {errors[type].times[timeIndex].days.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor={`${type}.times.${timeIndex}.startTime`}
                    className={cn(
                      "text-sm",
                      language === "ar" ? "font-arabic" : ""
                    )}
                  >
                    {t.startTimeLabel}
                  </Label>
                  <Controller
                    control={control}
                    name={`${type}.times.${timeIndex}.startTime`}
                    render={({ field }) => (
                      <Input type="time" {...field} className="text-base md:text-sm" />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`${type}.times.${timeIndex}.endTime`}
                    className={cn(
                      "text-sm",
                      language === "ar" ? "font-arabic" : ""
                    )}
                  >
                    {t.endTimeLabel}
                  </Label>
                  <Controller
                    control={control}
                    name={`${type}.times.${timeIndex}.endTime`}
                    render={({ field }) => (
                      <Input type="time" {...field} className="text-base md:text-sm" />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor={`${type}.times.${timeIndex}.classroom`}
                    className={cn(
                      "text-sm flex items-baseline gap-1.5",
                      language === "ar" ? "font-arabic" : ""
                    )}
                  >
                    <span>{t.classroomLabel}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.optionalLabel}
                    </span>
                  </Label>
                  <Controller
                    control={control}
                    name={`${type}.times.${timeIndex}.classroom`}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder={t.classroomPlaceholder}
                        className="text-base md:text-sm"
                      />
                    )}
                  />
                </div>
              </div>
              {(errors?.[type]?.times?.[timeIndex]?.startTime ||
                errors?.[type]?.times?.[timeIndex]?.endTime) && (
                <p className="text-sm text-destructive">
                  {errors?.[type]?.times?.[timeIndex]?.startTime?.message ||
                    errors?.[type]?.times?.[timeIndex]?.endTime?.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-2">
        <Button
          type="button"
          variant="outline"
          className={cn("w-full", language === "ar" ? "font-arabic" : "")}
          onClick={() =>
            appendTime({ days: [], startTime: "09:00", endTime: "10:00" })
          }
        >
          <Plus className="mr-2 h-4 w-4" />{" "}
          {type === "lecture" ? t.addLectureTimeSlot : t.addLabTimeSlot}
        </Button>
      </CardFooter>
    </Card>
  );
};

const AddClassTypeButton = ({
  type,
  onClick,
}: {
  type: "lecture" | "lab";
  onClick: () => void;
}) => {
  const { language } = useLanguage();
  const t = translations[language].sectionForm;

  return (
    <Card
      className={cn(
        "flex items-center justify-center border-2 border-dashed bg-card/50 hover:bg-accent/50 hover:border-solid transition-all h-full min-h-[300px]"
      )}
      role="button"
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center p-4 rounded-lg text-muted-foreground transition-colors w-full">
        {type === "lecture" ? (
          <BookText className="h-8 w-8 mb-2" />
        ) : (
          <FlaskConical className="h-8 w-8 mb-2" />
        )}
        <span
          className={cn(
            "font-semibold text-center",
            language === "ar" ? "font-arabic" : ""
          )}
        >
          {type === "lecture" ? t.addLectureButton : t.addLabButton}
        </span>
      </div>
    </Card>
  );
};

type SectionFormValues = z.infer<ReturnType<typeof createSectionFormSchema>>;

export function SectionForm({
  onSave,
  onBack,
  onCancel,
  section,
}: SectionFormProps) {
  const { language } = useLanguage();
  const t = translations[language].sectionForm;
  const formRef = useRef<HTMLFormElement>(null);
  const sectionFormSchema = createSectionFormSchema(t);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    mode: "onChange",
    defaultValues: section
      ? section
      : {
          id: `section_${Date.now()}`,
          name: "",
          lecture: undefined,
          lab: undefined,
          isEnabled: true,
        },
  });

  const hasLecture = !!watch("lecture");
  const hasLab = !!watch("lab");

  const processSubmit = (data: SectionFormValues) => {
    onSave(data as Section);
  };

  const toggleClassType = (type: "lecture" | "lab", add: boolean) => {
    if (add) {
      setValue(type, {
        times: [{ days: [], startTime: "09:00", endTime: "10:00" }],
      });
    } else {
      setValue(type, undefined);
    }
    trigger();
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit(processSubmit)}
      className="flex flex-col bg-transparent h-full"
    >
      <header
        className="p-1 mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h3
                className={cn(
                  "text-xl font-semibold",
                  language === "ar" ? "font-arabic" : ""
                )}
              >
                {section ? t.editTitle : t.addTitle}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Input
              id="name"
              {...register("name")}
              placeholder={t.sectionNamePlaceholder}
              className="text-base h-10 w-48"
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message || (errors.name as any)?.root?.message}
              </p>
            )}
            <input type="hidden" {...register("isEnabled")} />
            <Button
              type="submit"
              className={language === "ar" ? "font-arabic" : ""}
            >
              {t.saveButton}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow px-1 pb-4 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {hasLecture ? (
            <SectionTimeFields
              control={control}
              type="lecture"
              errors={errors}
            />
          ) : (
            <AddClassTypeButton
              type="lecture"
              onClick={() => toggleClassType("lecture", true)}
            />
          )}

          {hasLab ? (
            <SectionTimeFields
              control={control}
              type="lab"
              errors={errors}
            />
          ) : (
            <AddClassTypeButton
              type="lab"
              onClick={() => toggleClassType("lab", true)}
            />
          )}
        </div>
        {errors.root && (
          <p className="text-sm text-destructive font-semibold pt-4 text-center">
            {errors.root.message}
          </p>
        )}
      </main>
    </form>
  );
}

    
    