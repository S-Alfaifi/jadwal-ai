"use client"

import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Course, Day } from "@/lib/types";
import { ALL_DAYS } from "@/lib/types";
import { cn } from "@/lib/utils";

const sectionSchema = z.object({
  id: z.string().optional(),
  days: z.array(z.string()).min(1, "Please select at least one day."),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format."),
  type: z.enum(["Lecture", "Lab"]),
});

const courseSchema = z.object({
  name: z.string().min(2, "Course name must be at least 2 characters."),
  sections: z.array(sectionSchema).min(1, "Please add at least one section."),
}).refine(data => {
    for (const section of data.sections) {
        if (section.startTime >= section.endTime) {
            return false;
        }
    }
    return true;
}, {
    message: "End time must be after start time for all sections.",
    path: ["sections"],
});


type CourseFormValues = z.infer<typeof courseSchema>;

interface AddCourseFormProps {
  onSubmit: (data: CourseFormValues & { id?: string }) => void;
  course?: Course | null;
}

export function AddCourseForm({ onSubmit, course }: AddCourseFormProps) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ? 
      { name: course.name, sections: course.sections.map(s => ({...s})) } : 
      { name: "", sections: [{ days: [], startTime: "09:00", endTime: "10:00", type: "Lecture" }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "sections",
  });
  
  const processSubmit = (data: CourseFormValues) => {
    onSubmit({ ...data, id: course?.id });
  };

  return (
    <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Course Name</Label>
        <Input id="name" {...register("name")} placeholder="e.g. Introduction to AI" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                <Label className="text-base">Section {index + 1}</Label>
              
              <div className="space-y-2">
                <Label>Days</Label>
                <Controller
                  control={control}
                  name={`sections.${index}.days`}
                  render={({ field: { onChange, value } }) => (
                    <div className="flex flex-wrap gap-2">
                      {ALL_DAYS.map((day) => (
                        <Button
                          type="button"
                          key={day}
                          variant={value.includes(day) ? "default" : "outline"}
                          onClick={() => {
                            const newValue = value.includes(day)
                              ? value.filter((d) => d !== day)
                              : [...value, day];
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
                {errors.sections?.[index]?.days && <p className="text-sm text-destructive">{errors.sections[index]?.days?.message}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`sections.${index}.startTime`}>Start Time</Label>
                  <Input type="time" {...register(`sections.${index}.startTime`)} />
                  {errors.sections?.[index]?.startTime && <p className="text-sm text-destructive">{errors.sections[index]?.startTime?.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`sections.${index}.endTime`}>End Time</Label>
                  <Input type="time" {...register(`sections.${index}.endTime`)} />
                  {errors.sections?.[index]?.endTime && <p className="text-sm text-destructive">{errors.sections[index]?.endTime?.message}</p>}
                </div>
              </div>
               {errors.sections?.root && index === (errors.sections?.root as any).ref?.sections?.length - 1 && (
                  <p className="text-sm text-destructive col-span-2">{errors.sections.root.message}</p>
                )}


              <div className="space-y-2">
                <Label>Type</Label>
                <Controller
                  control={control}
                  name={`sections.${index}.type`}
                  render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Lecture" id={`lecture-${index}`} />
                        <Label htmlFor={`lecture-${index}`}>Lecture</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Lab" id={`lab-${index}`} />
                        <Label htmlFor={`lab-${index}`}>Lab</Label>
                      </div>
                    </RadioGroup>
                  )}
                />
              </div>

              {fields.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ days: [], startTime: "09:00", endTime: "10:00", type: "Lecture" })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Another Section
      </Button>

      {errors.sections && typeof errors.sections.message === 'string' && <p className="text-sm text-destructive">{errors.sections.message}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit">{course ? "Save Changes" : "Add Course"}</Button>
      </div>
    </form>
  );
}
