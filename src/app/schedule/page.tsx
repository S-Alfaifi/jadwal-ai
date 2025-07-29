
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
  const [excludedCourses, setExcludedCourses] = useState<Course[]>([]);
  const [includedCourses, setIncludedCourses] = useState<Course[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const runScheduler = useCallback(async () => {
    if (courses.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setAiSuggestions(null);
    setExcludedCourses([]);
    setIncludedCourses(courses);
    
    setTimeout(async () => {
      // Attempt to generate with all courses first
      let generatedSchedules = generateSchedules(courses, lockedSections);
      let bestSchedules = generatedSchedules;
      let finalIncludedCourses = courses;

      // If no schedule with all courses, try removing one at a time
      if (bestSchedules.length === 0 && courses.length > 1) {
        let maxCoursesScheduled = 0;
        let bestPartials: Schedule[] = [];
        let bestIncluded: Course[] = [];

        // Find the best possible partial schedules
        for (let i = 0; i < courses.length; i++) {
          const coursesToTry = courses.filter((_, index) => index !== i);
          const partialSchedules = generateSchedules(coursesToTry, lockedSections);

          if (partialSchedules.length > 0) {
             if (coursesToTry.length > maxCoursesScheduled) {
                maxCoursesScheduled = coursesToTry.length;
                bestPartials = partialSchedules;
                bestIncluded = coursesToTry;
             } else if (coursesToTry.length === maxCoursesScheduled) {
                bestPartials.push(...partialSchedules);
             }
          }
        }
        bestSchedules = bestPartials;
        finalIncludedCourses = bestIncluded;
      }
      
      const excluded = courses.filter(c => !finalIncludedCourses.some(ic => ic.id === c.id));
      setExcludedCourses(excluded);
      setIncludedCourses(finalIncludedCourses);


      if (bestSchedules.length > 0) {
        setSchedules(bestSchedules);
        setCurrentScheduleIndex(0);
      } else {
        // No schedules found at all, even with removals. Time for AI.
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
              // This logic could be improved to pass lab info as well
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
      return (
        <>
          <ScheduleControls
            current={currentScheduleIndex + 1}
            total={schedules.length}
            onNext={() => setCurrentScheduleIndex(i => (i + 1) % schedules.length)}
            onPrev={() => setCurrentScheduleIndex(i => (i - 1 + schedules.length) % schedules.length)}
            onShowAlternatives={() => { /* This can be used for more complex alternative views later */ }}
            disableSemesterSplit={true}
          />
           {excludedCourses.length > 0 && (
            <Alert className="mt-4 border-primary/50 text-primary-foreground">
              <Info className="h-4 w-4" />
              <AlertTitle>Partial Schedule Generated</AlertTitle>
              <AlertDescription>
                We couldn't fit all your courses. The schedule below works by excluding: <strong>{excludedCourses.map(c => c.name).join(', ')}</strong>.
              </AlertDescription>
            </Alert>
          )}
          <ScheduleView
            courses={includedCourses}
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

    