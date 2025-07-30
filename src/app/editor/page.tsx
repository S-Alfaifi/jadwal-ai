
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, BookOpen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddCourseForm } from "@/components/add-course-form";
import { CourseCard } from "@/components/course-card";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import type { Course, Section } from "@/lib/types";
import { generatePastelColor } from "@/lib/colors";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";

type CourseFormData = Omit<Course, 'id' | 'color' | 'sections' | 'isEnabled'> & { id?: string, sections: (Omit<Section, 'id' | 'isEnabled'> & {id?: string})[] };

export default function EditorPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    const savedCourses = localStorage.getItem("courses");
    if (savedCourses) {
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
      title: "Course Deleted",
      description: "The course has been removed from your list.",
    });
  };

  const handleFormSubmit = (data: CourseFormData) => {
    const sectionsWithIdsAndState = data.sections.map(s => ({
        ...s,
        id: s.id || `section_${Date.now()}_${Math.random()}`,
        isEnabled: true
    }));

    if (editingCourse) {
      const originalCourse = courses.find(c => c.id === editingCourse.id);
      const updatedSections = sectionsWithIdsAndState.map(newSection => {
        const oldSection = originalCourse?.sections.find(s => s.id === newSection.id);
        return oldSection ? { ...newSection, isEnabled: oldSection.isEnabled } : newSection;
      });

      setCourses(
        courses.map((c) => (c.id === editingCourse.id ? { ...c, ...data, sections: updatedSections } : c))
      );
      toast({
        title: "Course Updated",
        description: `"${data.name}" has been successfully updated.`,
      });
    } else {
      const newCourse: Course = { 
        ...data, 
        id: `course_${Date.now()}`,
        color: generatePastelColor(courses.length),
        sections: sectionsWithIdsAndState,
        isEnabled: true
      };
      setCourses([...courses, newCourse]);
      toast({
        title: "Course Added",
        description: `"${data.name}" has been added to your list.`,
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
        title: "No Active Courses",
        description: "Please enable at least one course and section to generate a schedule.",
        variant: "destructive",
      });
      return;
    }
    router.push("/schedule");
  };

  if (!isMounted) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <header className="py-6 px-4 md:px-8 border-b flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>
        
        <main className="flex-grow container mx-auto p-4 md:p-8">
          <div className="text-center mb-12">
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary-foreground tracking-tight">
              Create Your Schedule
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Add your courses below. Toggle courses or specific sections to include them in the final schedule.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center md:justify-end items-center gap-4 mb-8">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" disabled>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Data
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload course data from a file (coming soon!)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={handleAddCourseClick}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Course
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manually add a new course</p>
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
                  <h3 className="mt-4 text-lg font-medium text-primary-foreground">No courses added yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click on 'Add Course' to start building your schedule.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm p-4 border-t">
            <div className="max-w-4xl mx-auto">
              <Button size="lg" className="w-full" onClick={handleGenerateSchedule} disabled={courses.filter(c => c.isEnabled).length === 0}>
                Generate Schedule
              </Button>
            </div>
        </footer>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Add a New Course"}</DialogTitle>
              <DialogDescription>
                Fill in the details for the course, adding one or more sections with their lecture and lab times.
              </DialogDescription>
            </DialogHeader>
            <AddCourseForm
              key={editingCourse?.id || 'new'}
              onSubmit={handleFormSubmit}
              course={editingCourse}
            />
          </DialogContent>
        </Dialog>
      </div>
      <footer className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          © 2025 Sulaiman Alfaifi — All rights reserved
        </p>
      </footer>
    </TooltipProvider>
  );
}
