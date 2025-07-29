
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowLeft, Info } from 'lucide-react';
import { ScheduleView } from '@/components/schedule-view';
import { ScheduleControls } from '@/components/schedule-controls';
import { AiSuggestions } from '@/components/ai-suggestions';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Course, Schedule } from '@/lib/types';
import { generateSchedules } from '@/lib/scheduler';
import { suggestScheduleWorkarounds } from '@/ai/flows/suggest-schedule-workarounds';

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [lockedSections, setLockedSections] = useState<Record<string, string>>({});
  
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [excludedCourse, setExcludedCourse] = useState<Course | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      const parsedCourses: Course[] = JSON.parse(savedCourses);
      setCourses(parsedCourses);
    } else {
        setIsLoading(false);
    }
  }, []);

  const runScheduler = useCallback(async () => {
    if (courses.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setAiSuggestions(null);
    setExcludedCourse(null);
    
    setTimeout(async () => {
      let generated = generateSchedules(courses, lockedSections);

      // If no schedule, try removing one course at a time, starting from the last added one.
      if (generated.length === 0 && courses.length > 1) {
        for (let i = courses.length - 1; i >= 0; i--) {
          const courseToExclude = courses[i];
          const coursesToTry = courses.filter(c => c.id !== courseToExclude.id);
          const partialSchedules = generateSchedules(coursesToTry, lockedSections);
          if (partialSchedules.length > 0) {
            generated = partialSchedules;
            setExcludedCourse(courseToExclude);
            break; // Found a working partial schedule
          }
        }
      }

      if (generated.length > 0) {
        setSchedules(generated);
        setCurrentScheduleIndex(0);
      } else {
        setSchedules([]);
        setIsAiLoading(true);
        try {
          const formattedCoursesForAI = courses.map(course => ({
            name: course.name,
            sections: course.sections.map(section => {
              const lectureDetails = {
                id: section.id,
                name: section.name,
                days: section.lecture.days,
                startTime: section.lecture.startTime,
                endTime: section.lecture.endTime,
                type: 'Lecture' as const,
              };
              if (section.lab) {
                // This simplification might need adjustment based on AI model needs
                 return lectureDetails;
              }
              return lectureDetails;
            }),
          }));

          const result = await suggestScheduleWorkarounds({ courses: formattedCoursesForAI.flat() });
          setAiSuggestions(result.suggestions);
        } catch (error) {
          console.error("AI suggestion failed:", error);
          setAiSuggestions(["Could not fetch AI suggestions at this time."]);
        } finally {
          setIsAiLoading(false);
        }
      }
      setIsLoading(false);
    }, 50);
  }, [courses, lockedSections]);


  useEffect(() => {
    if (isMounted && courses.length > 0) {
      runScheduler();
    } else if (isMounted) {
      setIsLoading(false);
    }
  }, [courses, isMounted, runScheduler]);

  const currentSchedule = useMemo(() => schedules[currentScheduleIndex], [schedules, currentScheduleIndex]);

  const handleLockSection = (courseId: string, sectionId: string) => {
    // This functionality is currently disabled in the UI but the handler is here for future use.
  };
  const handleSectionChange = (courseId: string, newSectionId: string) => {
    // This functionality is currently disabled in the UI but the handler is here for future use.
  };

  if (!isMounted) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] flex-col">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Generating optimal schedules...</p>
        </div>
      );
    }
    
    if (schedules.length > 0 && currentSchedule) {
      const displayCourses = excludedCourse ? courses.filter(c => c.id !== excludedCourse.id) : courses;
      return (
        <>
          <ScheduleControls
            current={currentScheduleIndex + 1}
            total={schedules.length}
            onNext={() => setCurrentScheduleIndex(i => (i + 1) % schedules.length)}
            onPrev={() => setCurrentScheduleIndex(i => (i - 1 + schedules.length) % schedules.length)}
            onRegenerate={runScheduler}
            disableSemesterSplit={true}
          />
           {excludedCourse && (
            <Alert className="mt-4 border-primary/50 text-primary-foreground">
              <Info className="h-4 w-4" />
              <AlertTitle>Partial Schedule Generated</AlertTitle>
              <AlertDescription>
                We couldn't fit all your courses. The schedule below works by excluding <strong>{excludedCourse.name}</strong>.
              </AlertDescription>
            </Alert>
          )}
          <ScheduleView
            courses={displayCourses}
            schedule={currentSchedule}
            lockedSections={lockedSections}
            onLockToggle={handleLockSection}
            onSectionChange={handleSectionChange}
          />
        </>
      );
    }

    if (isAiLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] flex-col">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">No conflict-free schedules found. Consulting AI for workarounds...</p>
        </div>
      );
    }

    if (aiSuggestions) {
      return <AiSuggestions suggestions={aiSuggestions} onBack={() => router.push('/')} />;
    }

    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-8 bg-card rounded-lg border-2 border-dashed min-h-[60vh]">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-xl font-bold text-primary-foreground">No Conflict-Free Schedule Found</h3>
        <p className="mt-2 text-base text-muted-foreground">
          We couldn't generate a schedule with the provided courses, even after attempting to remove one course.
        </p>
        <Button onClick={() => router.push('/')} className="mt-6">
          Go Back and Edit Courses
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
       <header className="py-6 px-4 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
            <Logo />
            <Button variant="outline" onClick={() => router.push('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Edit
            </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
