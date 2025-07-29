"use client"

import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Course, Day } from "@/lib/types";
import { ALL_DAYS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const sectionTimeSchema = z.object({
  days: z.array(z.string()).min(1, "Please select at least one day."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
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
  sections: z.array(sectionSchema).min(1, "At least one section is required."),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface AddCourseFormProps {
  onSubmit: (data: CourseFormValues & { id?: string }) => void;
  course?: Course | null;
}

export function AddCourseForm({ onSubmit, course }: AddCourseFormProps) {
  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ? 
      { name: course.name, sections: course.sections.map(s => ({...s, hasLab: !!s.lab})) } :
      { name: "", sections: [{ id: `section_${Date.now()}`, name: "Section 1", lecture: { days: [], startTime: "09:00", endTime: "10:00" }, hasLab: false }] },
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
      setValue(`sections.${sectionIndex}.lab`, { days: [], startTime: "10:00", endTime: "11:00" });
    }
  }

  const renderSectionFields = (sectionIndex: number, type: 'lecture' | 'lab') => (
    <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
        <Label className="text-base capitalize">{type}</Label>
      
      <div className="space-y-2">
        <Label>Days</Label>
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
                  className="w-16"
                >
                  {day}
                </Button>
              ))}
            </div>
          )}
        />
        {errors.sections?.[sectionIndex]?.[type]?.days && <p className="text-sm text-destructive">{errors.sections?.[sectionIndex]?.[type]?.days?.message}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`sections.${sectionIndex}.${type}.startTime`}>Start Time</Label>
          <Input type="time" {...register(`sections.${sectionIndex}.${type}.startTime`)} />
          {errors.sections?.[sectionIndex]?.[type]?.startTime && <p className="text-sm text-destructive">{errors.sections?.[sectionIndex]?.[type]?.startTime?.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`sections.${sectionIndex}.${type}.endTime`}>End Time</Label>
          <Input type="time" {...register(`sections.${sectionIndex}.${type}.endTime`)} />
          {errors.sections?.[sectionIndex]?.[type]?.endTime && <p className="text-sm text-destructive">{errors.sections?.[sectionIndex]?.[type]?.endTime?.message}</p>}
        </div>
      </div>
      {(errors.sections?.[sectionIndex]?.lecture?.root || errors.sections?.[sectionIndex]?.lab?.root) && (
          <p className="text-sm text-destructive col-span-2">{errors.sections?.[sectionIndex]?.lecture?.root?.message || errors.sections?.[sectionIndex]?.lab?.root?.message}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Course Name</Label>
        <Input id="name" {...register("name")} placeholder="e.g. Introduction to AI" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {fields.map((field, index) => (
             <div key={field.id} className="p-4 border rounded-lg space-y-4 relative bg-card">
                <div className="flex justify-between items-center">
                    <div className="flex-grow space-y-2">
                        <Label htmlFor={`sections.${index}.name`}>Section Name</Label>
                        <Input {...register(`sections.${index}.name`)} placeholder="e.g. Section 001, LEC A" />
                         {errors.sections?.[index]?.name && <p className="text-sm text-destructive">{errors.sections?.[index]?.name?.message}</p>}
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
                        <Label htmlFor={`has-lab-${index}`}>This section has a lab</Label>
                    </div>

                    {sections[index]?.hasLab && renderSectionFields(index, 'lab')}
                </div>
            </div>
          ))}
          {errors.sections?.root && <p className="text-sm text-destructive">{errors.sections.root.message}</p>}
        </div>
         <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={() => append({ id: `section_${Date.now()}`, name: `Section ${fields.length + 1}`, lecture: { days: [], startTime: "09:00", endTime: "10:00" }, hasLab: false})}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Section
          </Button>
      </ScrollArea>

      <div className="flex justify-end pt-4">
        <Button type="submit">{course ? "Save Changes" : "Add Course"}</Button>
      </div>
    </form>
  );
}
