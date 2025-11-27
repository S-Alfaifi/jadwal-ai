
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddCourseForm } from "@/components/add-course-form";
import { CourseCard } from "@/components/course-card";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import type { Course, Section } from "@/lib/types";
import { generatePastelColor } from "@/lib/colors";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import DarkModeToggle from "@/components/DarkModeToggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

export default function EditorPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);
  
  useEffect(() => {
    setIsMounted(true);
    const savedCourses = localStorage.getItem("courses");
    if (savedCourses) {
      try {
        const parsedCourses: Course[] = JSON.parse(savedCourses);
        const coursesWithDefaults = parsedCourses.map(course => ({
            ...course,
            isEnabled: course.isEnabled !== undefined ? course.isEnabled : true,
            sections: course.sections.map(section => ({
                ...section,
                isEnabled: section.isEnabled !== undefined ? section.isEnabled : true
            }))
        }));
        setCourses(coursesWithDefaults);
      } catch (e) {
        console.error("Failed to parse courses from localStorage", e);
        localStorage.removeItem("courses"); // Clear corrupted data
      }
    }
  }, []);
  
  useEffect(() => {
    if(isMounted) {
      localStorage.setItem("courses", JSON.stringify(courses));
    }
  }, [courses, isMounted]);

  const handleAddCourseClick = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourses(courses.filter((c) => c.id !== courseId));
    toast({
      title: t.toasts.courseDeleted.title,
      description: t.toasts.courseDeleted.description,
    });
  };

  const handleFormSubmit = (data: Omit<Course, 'id' | 'color'>) => {
    if (editingCourse) {
      setCourses(
        courses.map((c) =>
          c.id === editingCourse.id ? { ...c, ...data } : c
        )
      );
      toast({
        title: t.toasts.courseUpdated.title,
        description: `"${data.name}" ${t.toasts.courseUpdated.description}`,
      });
    } else {
      const newCourse: Course = {
        ...data,
        id: `course_${Date.now()}`,
        color: generatePastelColor(courses.length),
        isEnabled: true,
        sections: data.sections.map(s => ({...s, isEnabled: true}))
      };
      setCourses([...courses, newCourse]);
      toast({
        title: t.toasts.courseAdded.title,
        description: `"${data.name}" ${t.toasts.courseAdded.description}`,
      });
    }
    setIsModalOpen(false);
  };

  const handleToggleCourse = (courseId: string, isEnabled: boolean) => {
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId ? { ...course, isEnabled } : course
      )
    );
  };

  const handleToggleSection = (courseId: string, sectionId: string, isEnabled: boolean) => {
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId
          ? {
              ...course,
              sections: course.sections.map(section =>
                section.id === sectionId ? { ...section, isEnabled } : section
              ),
            }
          : course
      )
    );
  };

  const handleUpdateCourseColor = (courseId: string, newColor: string) => {
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.id === courseId ? { ...course, color: newColor } : course
      )
    );
  };
  
  const handleGenerateSchedule = () => {
    const activeCourses = courses.filter(c => c.isEnabled && c.sections.some(s => s.isEnabled));
    if (activeCourses.length === 0) {
      toast({
        title: t.toasts.noActiveCourses.title,
        description: t.toasts.noActiveCourses.description,
        variant: "destructive",
      });
      return;
    }
    router.push("/schedule");
  };

  if (!isMounted) {
    return null;
  }

  const handleThemeToggle = (newIsDark: boolean) => {
    setTheme(newIsDark ? 'dark' : 'light');
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
          <header className="py-6 px-4 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
             <div className="container mx-auto flex items-center" dir="ltr">
              <Logo />
              <div className="flex-grow" />
              <div className="flex items-center gap-4">
                <LanguageToggle />
                <DarkModeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>
          
          <main className="flex-grow container mx-auto p-4 md:p-8">
            <div className="text-center mb-12">
              <h1 className={cn('font-headline text-4xl md:text-5xl font-bold text-foreground tracking-tight', language === 'ar' && 'font-arabic md:text-6xl')}>
                {t.editor.title}
              </h1>
              <p className={cn('text-muted-foreground mt-4 max-w-2xl mx-auto', language === 'ar' && 'font-arabic')}>
                {t.editor.subtitle}
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="flex justify-end items-center gap-4 mb-8" dir="ltr">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={handleAddCourseClick} className={language === 'ar' ? 'font-arabic' : ''}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t.editor.addCourse}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className={language === 'ar' ? 'font-arabic' : ''}>
                    <p>{t.editor.addCourseTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-4">
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onEdit={() => handleEditCourse(course)}
                      onDelete={() => handleDeleteCourse(course.id)}
                      onToggleCourse={handleToggleCourse}
                      onToggleSection={handleToggleSection}
                      onUpdateCourseColor={handleUpdateCourseColor}
                    />
                  ))
                ) : (
                  <div className="text-center py-16 px-8 bg-card rounded-lg border-2 border-dashed">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className={cn('mt-4 text-lg font-medium text-foreground', language === 'ar' && 'font-arabic')}>{t.editor.noCourses.title}</h3>
                    <p className={cn('mt-2 text-sm text-muted-foreground', language === 'ar' && 'font-arabic')}>
                      {t.editor.noCourses.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </main>

          <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t z-50">
              <div className="max-w-4xl mx-auto">
                <Button size="lg" className={cn('w-full', language === 'ar' && 'font-arabic')} onClick={handleGenerateSchedule} disabled={courses.filter(c => c.isEnabled).length === 0}>
                  {t.editor.generateSchedule}
                </Button>
              </div>
          </footer>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[1000px]">
              <DialogHeader>
                <DialogTitle className={language === 'ar' ? 'font-arabic' : ''}>{editingCourse ? t.addCourseForm.editTitle : t.addCourseForm.addTitle}</DialogTitle>
                <DialogDescription className={language === 'ar' ? 'font-arabic' : ''}>
                  {editingCourse ? t.addCourseForm.description.edit : t.addCourseForm.description.add}
                </DialogDescription>
              </DialogHeader>
              <AddCourseForm
                key={editingCourse?.id || 'new'}
                onSubmit={handleFormSubmit}
                course={editingCourse}
                onClose={() => setIsModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        <footer className="text-center py-4">
          <p className={cn('text-xs text-muted-foreground', language === 'ar' ? 'font-arabic' : '')}>
             {t.footer.rights}
          </p>
        </footer>
    </TooltipProvider>
  );
}
