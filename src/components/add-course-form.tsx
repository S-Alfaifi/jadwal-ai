
"use client"

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, ArrowLeft, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Course, Section } from "@/lib/types";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { SectionForm } from "./section-form";
import { Switch } from "./ui/switch";
import { Card, CardContent } from "./ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";

const courseSchema = z.object({
  name: z.string().min(2, "Course name must be at least 2 characters."),
  finalExamPeriod: z.coerce.number().optional(),
  sections: z.array(z.custom<Section>()).min(1, "At least one section is required."),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface AddCourseFormProps {
  onSubmit: (data: Omit<Course, 'id' | 'color' | 'isEnabled'>) => void;
  course?: Course | null;
  onClose: () => void;
}

export function AddCourseForm({ onSubmit, course, onClose }: AddCourseFormProps) {
  const { language } = useLanguage();
  const t = translations[language].addCourseForm;
  const sectionFormT = translations[language].sectionForm;

  const [view, setView] = useState<'main' | 'section'>('main');
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null);

  const { register, control, handleSubmit, formState: { errors }, watch, setValue, trigger } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: course ?
      { name: course.name, finalExamPeriod: course.finalExamPeriod, sections: course.sections } :
      { name: "", sections: [] },
  });

  const sections = watch("sections");

  const handleEditSection = (index: number) => {
    setEditingSection(sections[index]);
    setEditingSectionIndex(index);
    setView('section');
  };
  
  const handleAddNewSection = () => {
    setEditingSection(null);
    setEditingSectionIndex(null);
    setView('section');
  };

  const handleSaveSection = (sectionData: Section) => {
    const newSections = [...sections];
    if (editingSectionIndex !== null) {
      // Editing existing section
      newSections[editingSectionIndex] = sectionData;
    } else {
      // Adding new section
      newSections.push({ ...sectionData, id: `section_${Date.now()}`});
    }
    setValue("sections", newSections, { shouldValidate: true });
    setView('main');
  };

  const handleDeleteSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index, 1);
    setValue("sections", newSections, { shouldValidate: true });
  };
  
  const handleToggleSection = (index: number, isEnabled: boolean) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], isEnabled };
    setValue("sections", newSections, { shouldValidate: true });
  };


  const processAndSubmit = async () => {
    const isValid = await trigger();
    if(isValid) {
      const data = watch();
      const finalData = {
        name: data.name,
        finalExamPeriod: data.finalExamPeriod,
        sections: data.sections.map(({ id, isEnabled, ...rest }) => rest)
      };
      // @ts-ignore
      onSubmit(data);
    }
  }

  const renderMainView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className={language === 'ar' ? 'font-arabic' : ''}>{t.courseNameLabel}</Label>
          <Input id="name" {...register("name")} placeholder={t.courseNamePlaceholder} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="finalExamPeriod" className={language === 'ar' ? 'font-arabic' : ''}>{t.examPeriodLabel}</Label>
          <Input id="finalExamPeriod" type="number" {...register("finalExamPeriod")} placeholder={t.examPeriodPlaceholder} />
          {errors.finalExamPeriod && <p className="text-sm text-destructive">{errors.finalExamPeriod.message}</p>}
        </div>
      </div>
      <div>
        <Label className={cn("text-base", language === 'ar' ? 'font-arabic' : '')}>{t.sectionsLabel}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {sections.map((section, index) => (
             <Card key={section.id || index} className={cn("overflow-hidden", !section.isEnabled && 'opacity-50 bg-muted/50')}>
                <CardContent className={cn("p-4 flex flex-col justify-between h-full min-h-[140px]", language === 'ar' ? 'text-right' : '')}>
                    <div className="flex justify-between items-start">
                        <p className="font-bold truncate pr-2">{section.name}</p>
                        <div className="toggle-wrapper">
                          <Switch
                              checked={section.isEnabled}
                              onCheckedChange={(checked) => handleToggleSection(index, checked)}
                              aria-label={`Toggle section ${section.name}`}
                          />
                        </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                        {section.lecture?.times?.length || 0} {language === 'en' ? sectionFormT.classTypes.lecture.toLowerCase() : 'نظري'}, {section.lab ? `${section.lab.times.length} ${sectionFormT.classTypes.lab.toLowerCase()}` : `0 ${sectionFormT.classTypes.lab.toLowerCase()}`}
                    </p>

                    <div className="flex justify-end gap-2 mt-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => handleEditSection(index)}><Edit className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button type="button" size="sm" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className={language === 'ar' ? 'font-arabic' : ''}>{t.deleteSectionDialog.title}</AlertDialogTitle>
                              <AlertDialogDescription className={language === 'ar' ? 'font-arabic' : ''}>
                                 {t.deleteSectionDialog.description}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className={language === 'ar' ? 'font-arabic' : ''}>{t.deleteSectionDialog.cancel}</AlertDialogCancel>
                              <AlertDialogAction className={language === 'ar' ? 'font-arabic' : ''} onClick={() => handleDeleteSection(index)}>{t.deleteSectionDialog.confirm}</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
          ))}
          <div
            role="button"
            onClick={handleAddNewSection}
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed bg-transparent rounded-lg cursor-pointer hover:bg-accent/50 hover:border-solid text-muted-foreground hover:text-accent-foreground transition-colors min-h-[140px]"
          >
              <Plus className="h-6 w-6 mb-2" />
              <span className={cn('font-medium', language === 'ar' ? 'font-arabic' : '')}>{t.addSectionButton}</span>
          </div>
        </div>
      </div>
       {errors.sections && <p className="text-sm text-destructive">{errors.sections.message}</p>}

      <div className="flex justify-between items-center pt-4">
         <Button type="button" variant="outline" onClick={onClose} className={language === 'ar' ? 'font-arabic' : ''}>{t.cancelButton}</Button>
        <Button type="button" onClick={processAndSubmit} className={language === 'ar' ? 'font-arabic' : ''}>{course ? t.submitButton.edit : t.submitButton.add}</Button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
        {view === 'main' ? renderMainView() : (
            <SectionForm 
                section={editingSection} 
                onSave={handleSaveSection} 
                onBack={() => setView('main')}
                onCancel={onClose}
            />
        )}
    </div>
  );
}

    