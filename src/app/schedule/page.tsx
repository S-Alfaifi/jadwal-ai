
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowLeft, Info, Download } from 'lucide-react';
import { ScheduleView } from '@/components/schedule-view';
import { ScheduleControls } from '@/components/schedule-controls';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Course, Schedule, GenerationResult, Conflict } from '@/lib/types';
import { generateSchedules } from '@/lib/scheduler';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from '@/components/theme-toggle';

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const scheduleRef = useRef<{
    scheduleGrid: HTMLDivElement | null;
  }>(null);

  const runScheduler = useCallback(() => {
    const activeCourses = courses
      .filter(c => c.isEnabled)
      .map(c => ({
          ...c,
          sections: c.sections.filter(s => s.isEnabled)
      }))
      .filter(c => c.sections.length > 0);

    if (activeCourses.length === 0) {
      setGenerationResult({ schedules: [], conflicts: [], excludedCourses: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setCurrentScheduleIndex(0);
    
    setTimeout(() => {
        const result = generateSchedules(activeCourses);
        setGenerationResult(result);
        setIsLoading(false);
    }, 50);
  }, [courses]);

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

  useEffect(() => {
    if (isMounted && courses.length > 0) {
      runScheduler();
    } else if (isMounted) {
      setIsLoading(false);
    }
  }, [isMounted, courses, runScheduler]);

  const { schedules = [], conflicts = [] } = generationResult || {};

  const { currentSchedule, includedCoursesInSchedule, excludedCoursesForThisSchedule, conflictForThisSchedule } = useMemo(() => {
    if (!schedules || schedules.length === 0) {
      return { currentSchedule: null, includedCoursesInSchedule: [], excludedCoursesForThisSchedule: [], conflictForThisSchedule: null };
    }
    const schedule = schedules[currentScheduleIndex];
    if (!schedule) {
       return { currentSchedule: null, includedCoursesInSchedule: [], excludedCoursesForThisSchedule: [], conflictForThisSchedule: null };
    }
    
    const includedIds = new Set(Object.keys(schedule));
    const included = courses.filter(c => includedIds.has(c.id));
    
    const activeCourses = courses.filter(c => c.isEnabled && c.sections.some(s => s.isEnabled));
    const allCourseIds = new Set(activeCourses.map(c => c.id));
    
    included.forEach(c => allCourseIds.delete(c.id));
    const excluded = activeCourses.filter(c => allCourseIds.has(c.id));

    const conflict = conflicts.find(c => {
        const conflictCourseIds = new Set(c.courses.map(course => course.id));
        return excluded.some(excludedCourse => conflictCourseIds.has(excludedCourse.id));
    });
    
    return { 
        currentSchedule: schedule, 
        includedCoursesInSchedule: included, 
        excludedCoursesForThisSchedule: excluded,
        conflictForThisSchedule: conflict,
    };
  }, [schedules, currentScheduleIndex, courses, conflicts]);


  const handleSaveImage = useCallback(async () => {
    if (!scheduleRef.current?.scheduleGrid) {
      return;
    }

    const element = scheduleRef.current.scheduleGrid;
    
    // Temporarily apply styles to capture the full content
    const originalStyle = element.style.cssText;
    element.style.overflow = 'visible';
    element.style.width = `${element.scrollWidth}px`;
    element.style.height = 'auto';


    try {
        const computedStyle = window.getComputedStyle(element);
        const backgroundColor = computedStyle.backgroundColor;

        const dataUrl = await toPng(element, {
            cacheBust: true,
            backgroundColor: backgroundColor,
            pixelRatio: 2,
        });

        const link = document.createElement('a');
        link.download = 'schedule.png';
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Failed to save image', err);
    } finally {
        // Restore original styles
        element.style.cssText = originalStyle;
    }
  }, []);


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
            onSaveImage={handleSaveImage}
          />
           {excludedCoursesForThisSchedule.length > 0 && (
            <Alert className="mt-4 border-primary/50 text-primary-foreground">
              <Info className="h-4 w-4" />
              <AlertTitle>Partial Schedule Generated</AlertTitle>
              <AlertDescription>
                 {conflictForThisSchedule ? (
                    <p className="font-semibold">
                      {conflictForThisSchedule.courses.map(c => c.name).join(' and ')} have a {conflictForThisSchedule.type} conflict.
                    </p>
                 ) : (
                    <p>A full schedule could not be generated with all selected courses.</p>
                 )}
                <p className="mt-2">To make a schedule, we had to exclude: <strong>{excludedCoursesForThisSchedule.map(c => c.name).join(', ')}</strong>.</p>
                <p className="mt-1">This schedule includes: <strong>{includedCoursesInSchedule.map(c => c.name).join(', ')}</strong>.</p>
              </AlertDescription>
            </Alert>
          )}
          
          <ScheduleView
            ref={scheduleRef}
            courses={includedCoursesInSchedule}
            schedule={currentSchedule}
          />

        </>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-8 bg-card rounded-lg border-2 border-dashed min-h-[60vh]">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-xl font-bold text-primary-foreground">No Conflict-Free Schedule Found</h3>
        {conflicts.length > 0 ? (
           <p className="mt-2 text-base text-muted-foreground">{conflicts[0].message}</p>
        ) : (
           <p className="mt-2 text-base text-muted-foreground">
             We couldn't generate any possible schedule with the courses and sections you enabled.
           </p>
        )}
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
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => router.push('/')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Edit
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Return to the course selection page</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        <TooltipProvider>
          {renderContent()}
        </TooltipProvider>
      </main>
    </div>
  );
}
