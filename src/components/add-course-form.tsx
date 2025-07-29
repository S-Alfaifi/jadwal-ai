"use client"

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Course, Day } from "@/lib/types";
import { ALL_DAYS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

const sectionTimeSchema = z.object({
  id: z.string().optional(),
  days: z.array(z.string()).min(1, "Please select at least one day."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
});

const courseSchema = z.object({
  name: z.string().min(2, "Course name must be at least 2 characters."),
  lecture: sectionTimeSchema,
  lab: sectionTimeSchema.optional(),
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


type CourseFormValues = z.infer<typeof courseSchema>;

interface AddCourseFormProps {
  onSubmit: (data: CourseFormValues & { id?: string }) => void;
  course?: Course | null;
}

export function AddCourseForm({ onSubmit, course }: AddCourseFormProps) {
  const [hasLab, setHasLab] = useState(!!course?.lab);
  
  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ? 
      { name: course.name, lecture: course.lecture, lab: course.lab } : 
      { name: "", lecture: { days: [], startTime: "09:00", endTime: "10:00" } },
  });

  const processSubmit = (data: CourseFormValues) => {
    const finalData = { ...data };
    if (!hasLab) {
      delete finalData.lab;
    }
    onSubmit({ ...finalData, id: course?.id });
  };
  
  const toggleLab = (checked: boolean) => {
    setHasLab(checked);
    if (!checked) {
      setValue('lab', undefined);
    } else {
      setValue('lab', { days: [], startTime: "10:00", endTime: "11:00" });
    }
  }

  const renderSectionFields = (type: 'lecture' | 'lab') => (
    <div className="p-4 border rounded-lg space-y-4">
        <Label className="text-base capitalize">{type}</Label>
      
      <div className="space-y-2">
        <Label>Days</Label>
        <Controller
          control={control}
          name={`${type}.days`}
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
        {errors[type]?.days && <p className="text-sm text-destructive">{errors[type]?.days?.message}</p>}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${type}.startTime`}>Start Time</Label>
          <Input type="time" {...register(`${type}.startTime`)} />
          {errors[type]?.startTime && <p className="text-sm text-destructive">{errors[type]?.startTime?.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${type}.endTime`}>End Time</Label>
          <Input type="time" {...register(`${type}.endTime`)} />
          {errors[type]?.endTime && <p className="text-sm text-destructive">{errors[type]?.endTime?.message}</p>}
        </div>
      </div>
      {(errors.lecture?.root || errors.lab?.root) && (
          <p className="text-sm text-destructive col-span-2">{errors.lecture?.root?.message || errors.lab?.root?.message}</p>
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

      <ScrollArea className="h-[350px] pr-4">
        <div className="space-y-6">
          {renderSectionFields('lecture')}
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="has-lab" checked={hasLab} onCheckedChange={toggleLab} />
            <Label htmlFor="has-lab">This course has a lab</Label>
          </div>

          {hasLab && renderSectionFields('lab')}
        </div>
      </ScrollArea>

      <div className="flex justify-end pt-4">
        <Button type="submit">{course ? "Save Changes" : "Add Course"}</Button>
      </div>
    </form>
  );
}
