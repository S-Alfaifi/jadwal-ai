
"use client"

import React, { useRef } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Course } from "@/lib/types";
import { ALL_DAYS, Day } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

const sectionTimeSchema = z.object({
  days: z.array(z.string()).min(1, "Please select at least one day."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
  classroom: z.string().optional(),
});

const sectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Section name is required."),
  lecture: sectionTimeSchema,
  lab: sectionTimeSchema.optional(),
  hasLab: z.boolean().optional(),
}).refine(data => {
    if (data.lecture.startTime >= data.lecture.endTime) {
        return false;
    }
    if (data.lab && data.lab.startTime >= data.lab.endTime) {
      return false;
    }
    return true;
}, {
    message: "End time must be after start time.",
    path: ["lecture"], // Simplified path, apply to both
});

const courseSchema = z.object({
  name: z.string().min(2, "Course name must be at least 2 characters."),
  finalExamPeriod: z.coerce.number().optional(),
  sections: z.array(sectionSchema).min(1, "At least one section is required."),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface AddCourseFormProps {
  onSubmit: (data: CourseFormValues & { id?: string }) => void;
  course?: Course | null;
}

export function AddCourseForm({ onSubmit, course }: AddCourseFormProps) {
  const { language } = useLanguage();
  const t = translations[language].addCourseForm;
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getDayName = (day: Day) => {
    return t.days[day];
  }
  
  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ? 
      { name: course.name, finalExamPeriod: course.finalExamPeriod, sections: course.sections.map(s => ({...s, hasLab: !!s.lab})) } :
      { name: "", sections: [{ id: `section_${Date.now()}`, name: t.sectionNamePlaceholder, lecture: { days: [], startTime: "09:00", endTime: "10:00", classroom: "" }, hasLab: false }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sections"
  });

  const sections = watch("sections");

  const processSubmit = (data: CourseFormValues) => {
    const finalData = {
        ...data,
        sections: data.sections.map(s => {
            const { hasLab, ...rest } = s;
            if(!hasLab) {
                delete rest.lab;
            }
            return rest;
        })
    };
    onSubmit({ ...finalData, id: course?.id });
  };
  
  const toggleLab = (sectionIndex: number, checked: boolean) => {
    setValue(`sections.${sectionIndex}.hasLab`, checked);
    if (!checked) {
      setValue(`sections.${sectionIndex}.lab`, undefined);
    } else {
      setValue(`sections.${sectionIndex}.lab`, { days: [], startTime: "10:00", endTime: "11:00", classroom: "" });
      setTimeout(() => {
        sectionRefs.current[sectionIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }

  const renderSectionFields = (sectionIndex: number, type: 'lecture' | 'lab') => (
    <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
        <Label className={`text-base capitalize ${language === 'ar' ? 'font-arabic' : ''}`}>{t.classTypes[type]}</Label>

        <div className="space-y-2">
            <Label htmlFor={`sections.${sectionIndex}.${type}.classroom`} className={language === 'ar' ? 'font-arabic' : ''}>{t.classroomLabel}</Label>
            <Input {...register(`sections.${sectionIndex}.${type}.classroom`)} placeholder={t.classroomPlaceholder} />
            {errors.sections?.[sectionIndex]?.[type]?.classroom && <p className="text-sm text-destructive">{errors.sections?.[sectionIndex]?.[type]?.classroom?.message}</p>}
        </div>
      
      <div className="space-y-2">
        <Label className={language === 'ar' ? 'font-arabic' : ''}>{t.daysLabel}</Label>
        <Controller
          control={control}
          name={`sections.${sectionIndex}.${type}.days`}
          render={({ field: { onChange, value } }) => (
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => (
                <Button
                  type="button"
                  key={day}
                  variant={value?.includes(day) ? "default" : "outline"}
                  onClick={() => {
                    const currentVal = value || [];
                    const newValue = currentVal.includes(day)
                      ? currentVal.filter((d) => d !== day)
                      : [...currentVal, day];
                    onChange(newValue);
                  }}
                  className={`w-16 ${language === 'ar' ? 'font-arabic' : ''}`}
                >
                  {getDayName(day)}
                </Button>
              ))}
            </div>
          )}
        />
        {errors.sections?.[sectionIndex]?.[type]?.days && <p className="text-sm text-destructive">{t.errors.selectDay}</p>}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`sections.${sectionIndex}.${type}.startTime`} className={language === 'ar' ? 'font-arabic' : ''}>{t.startTimeLabel}</Label>
          <Input type="time" {...register(`sections.${sectionIndex}.${type}.startTime`)} />
          {errors.sections?.[sectionIndex]?.[type]?.startTime && <p className="text-sm text-destructive">{t.errors.invalidTime}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`sections.${sectionIndex}.${type}.endTime`} className={language === 'ar' ? 'font-arabic' : ''}>{t.endTimeLabel}</Label>
          <Input type="time" {...register(`sections.${sectionIndex}.${type}.endTime`)} />
          {errors.sections?.[sectionIndex]?.[type]?.endTime && <p className="text-sm text-destructive">{t.errors.invalidTime}</p>}
        </div>
      </div>
      {(errors.sections?.[sectionIndex]?.lecture?.root || errors.sections?.[sectionIndex]?.lab?.root) && (
          <p className="text-sm text-destructive col-span-2">{t.errors.endTimeAfterStart}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-2">
            <Label htmlFor="name" className={language === 'ar' ? 'font-arabic' : ''}>{t.courseNameLabel}</Label>
            <Input id="name" {...register("name")} placeholder={t.courseNamePlaceholder} />
            {errors.name && <p className="text-sm text-destructive">{t.errors.courseNameRequired}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="finalExamPeriod" className={language === 'ar' ? 'font-arabic' : ''}>{t.examPeriodLabel}</Label>
            <Input id="finalExamPeriod" type="number" {...register("finalExamPeriod")} placeholder={t.examPeriodPlaceholder} />
            {errors.finalExamPeriod && <p className="text-sm text-destructive">{errors.finalExamPeriod.message}</p>}
        </div>
      </div>


      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {fields.map((field, index) => (
             <div key={field.id} ref={el => sectionRefs.current[index] = el} className="p-4 border rounded-lg space-y-4 relative bg-card">
                <div className="flex justify-between items-start">
                    <div className="flex-grow space-y-2">
                      <Label htmlFor={`sections.${index}.name`} className={language === 'ar' ? 'font-arabic' : ''}>{t.sectionNameLabel}</Label>
                      <Input {...register(`sections.${index}.name`)} placeholder={t.sectionNamePlaceholder} />
                      {errors.sections?.[index]?.name && <p className="text-sm text-destructive">{t.errors.sectionNameRequired}</p>}
                    </div>
                     {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="ml-4 flex-shrink-0">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    )}
                </div>
                
                <div className="space-y-4">
                    {renderSectionFields(index, 'lecture')}
                    
                    <div className="flex items-center space-x-2 pt-2">
                        <Controller
                            control={control}
                            name={`sections.${index}.hasLab`}
                            render={({ field: { value, ...field } }) => (
                                <Switch
                                    {...field}
                                    checked={value}
                                    onCheckedChange={(checked) => toggleLab(index, checked)}
                                    id={`has-lab-${index}`}
                                />
                            )}
                        />
                        <Label htmlFor={`has-lab-${index}`} className={language === 'ar' ? 'font-arabic' : ''}>{t.hasLabLabel}</Label>
                    </div>

                    {sections[index]?.hasLab && renderSectionFields(index, 'lab')}
                </div>
            </div>
          ))}
          {errors.sections?.root && <p className="text-sm text-destructive">{t.errors.atLeastOneSection}</p>}
        </div>
         <Button
            type="button"
            variant="outline"
            className={`mt-4 w-full ${language === 'ar' ? 'font-arabic' : ''}`}
            onClick={() => append({ id: `section_${Date.now()}`, name: `${t.sectionNamePlaceholder} ${fields.length + 1}`, lecture: { days: [], startTime: "09:00", endTime: "10:00", classroom: "" }, hasLab: false})}
          >
            <Plus className="mr-2 h-4 w-4" /> {t.addSectionButton}
          </Button>
      </ScrollArea>

      <div className="flex justify-end pt-4">
        <Button type="submit" className={language === 'ar' ? 'font-arabic' : ''}>{course ? t.submitButton.edit : t.submitButton.add}</Button>
      </div>
    </form>
  );
}
