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

type CourseFormData = Omit<Course, 'id' | 'color' | 'sections'> & { id?: string, sections: (Omit<Section, 'id'> & {id?: string})[] };

export default function Home() {
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
      setCourses(JSON.parse(savedCourses));
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
    const sectionsWithIds = data.sections.map(s => ({
        ...s,
        id: s.id || `section_${Date.now()}_${Math.random()}`
    }));

    if (editingCourse) {
      setCourses(
        courses.map((c) => (c.id === editingCourse.id ? { ...c, ...data, id: c.id, sections: sectionsWithIds } : c))
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
        sections: sectionsWithIds
      };
      setCourses([...courses, newCourse]);
      toast({
        title: "Course Added",
        description: `"${data.name}" has been added to your list.`,
      });
    }
    setIsModalOpen(false);
  };
  
  const handleGenerateSchedule = () => {
    if (courses.length === 0) {
      toast({
        title: "No Courses Added",
        description: "Please add at least one course to generate a schedule.",
        variant: "destructive",
      });
      return;
    }
    router.push("/schedule");
  };

  if (!isMounted) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-6 px-4 md:px-8 border-b">
        <Logo />
      </header>
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary-foreground tracking-tight">
            Create Your Schedule
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Add your courses and their sections below. Our intelligent planner will then generate conflict-free schedules for you.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center md:justify-end items-center gap-4 mb-8">
             <Button variant="outline" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Upload Data
            </Button>
            <Button onClick={handleAddCourseClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </div>

          <div className="space-y-4">
            {courses.length > 0 ? (
              courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEdit={() => handleEditCourse(course)}
                  onDelete={() => handleDeleteCourse(course.id)}
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
            <Button size="lg" className="w-full" onClick={handleGenerateSchedule} disabled={courses.length === 0}>
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
  );
}
