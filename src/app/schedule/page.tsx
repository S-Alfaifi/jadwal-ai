
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowLeft, Info } from 'lucide-react';
import { ScheduleView } from '@/components/schedule-view';
import { ScheduleControls } from '@/components/schedule-controls';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Course, Schedule } from '@/lib/types';
import { generateSchedules } from '@/lib/scheduler';
import { TooltipProvider } from "@/components/ui/tooltip"

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const getCombinations = <T,>(array: T[], size: number): T[][] => {
    const result: T[][] = [];
    function combinationUtil(start: number, chosen: T[]) {
      if (chosen.length === size) {
        result.push([...chosen]);
        return;
      }
      if (start >= array.length) {
        return;
      }
      chosen.push(array[start]);
      combinationUtil(start + 1, chosen);
      chosen.pop();
      combinationUtil(start + 1, chosen);
    }
    combinationUtil(0, []);
    return result;
  };

  const runScheduler = useCallback(() => {
    if (courses.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setCurrentScheduleIndex(0);
    
    setTimeout(() => {
        let generatedSchedules: Schedule[] = [];

        // Try with all courses first
        generatedSchedules = generateSchedules(courses, {});

        // If no schedule, try removing courses one by one
        if (generatedSchedules.length === 0 && courses.length > 1) {
            for (let i = courses.length - 1; i >= 1; i--) {
                const courseCombinations = getCombinations(courses, i);
                for (const combo of courseCombinations) {
                    const partialSchedules = generateSchedules(combo, {});
                    if (partialSchedules.length > 0) {
                        generatedSchedules.push(...partialSchedules);
                    }
                }
                if (generatedSchedules.length > 0) {
                    break;
                }
            }
        }

        if (generatedSchedules.length > 0) {
            const uniqueSchedules = [...new Set(generatedSchedules.map(s => JSON.stringify(s)))].map(s => JSON.parse(s));
            setSchedules(uniqueSchedules);
        } else {
            setSchedules([]);
        }
        
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

  const { currentSchedule, includedCoursesInSchedule, excludedCoursesInSchedule } = useMemo(() => {
    if (!schedules || schedules.length === 0) {
      return { currentSchedule: null, includedCoursesInSchedule: [], excludedCoursesInSchedule: [] };
    }
    const schedule = schedules[currentScheduleIndex];
    if (!schedule) {
       return { currentSchedule: null, includedCoursesInSchedule: [], excludedCoursesInSchedule: [] };
    }
    const includedIds = Object.keys(schedule);
    const included = courses.filter(c => includedIds.includes(c.id));
    const excluded = courses.filter(c => !includedIds.includes(c.id));
    return { currentSchedule: schedule, includedCoursesInSchedule: included, excludedCoursesInSchedule: excluded };
  }, [schedules, currentScheduleIndex, courses]);

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
            onRegenerate={runScheduler}
          />
           {excludedCoursesInSchedule.length > 0 && (
            <Alert className="mt-4 border-primary/50 text-primary-foreground">
              <Info className="h-4 w-4" />
              <AlertTitle>Partial Schedule Generated</AlertTitle>
              <AlertDescription>
                We couldn't fit all your courses. The schedule below works by excluding: <strong>{excludedCoursesInSchedule.map(c => c.name).join(', ')}</strong>.
              </AlertDescription>
            </Alert>
          )}
          <ScheduleView
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
        <p className="mt-2 text-base text-muted-foreground">
          We couldn't generate any possible schedule with the courses you provided.
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
        <TooltipProvider>
          {renderContent()}
        </TooltipProvider>
      </main>
    </div>
  );
}
