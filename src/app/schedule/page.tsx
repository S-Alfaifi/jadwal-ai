
"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowLeft, Download, Sparkles } from 'lucide-react';
import { ScheduleView } from '@/components/schedule-view';
import { ScheduleControls } from '@/components/schedule-controls';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Course, Schedule, GenerationResult, Conflict } from '@/lib/types';
import { generateSchedules } from '@/lib/scheduler';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from '@/components/theme-toggle';
import { suggestWorkarounds, type SuggestWorkaroundsInput } from '@/ai/flows/suggest-schedule-workarounds';

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [showSectionNames, setShowSectionNames] = useState(true);
  const [showClassTypes, setShowClassTypes] = useState(true);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

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
    setAiSuggestions([]);
    
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
        return excluded.some(excludedCourse => conflictCourseIds.has(excludedCourse.id)) || c.courses.every(cc => includedIds.has(cc.id));
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
    
    const contentElement = scheduleRef.current.scheduleGrid.firstChild as HTMLElement;
    if (!contentElement) return;

    try {
        const backgroundColor = window.getComputedStyle(document.body).backgroundColor;

        const dataUrl = await toPng(contentElement, {
            cacheBust: true,
            skipFonts: true,
            backgroundColor,
            pixelRatio: 2,
            width: contentElement.scrollWidth,
            height: contentElement.scrollHeight,
        });

        const link = document.createElement('a');
        link.download = 'schedule.png';
        link.href = dataUrl;
        link.click();
    } catch (err) {
        console.error('Failed to save image', err);
    }
  }, []);

  const handleGetAiSuggestions = async () => {
    if (!conflictForThisSchedule) return;

    setIsAiLoading(true);
    setAiSuggestions([]);

    try {
        const input: SuggestWorkaroundsInput = {
            conflictingCourses: conflictForThisSchedule.courses,
            conflictType: conflictForThisSchedule.type,
        };
        const result = await suggestWorkarounds(input);
        setAiSuggestions(result.suggestions);
    } catch (error) {
        console.error("AI suggestion error:", error);
        setAiSuggestions(["Sorry, I couldn't generate suggestions at this time. Please try again later."]);
    } finally {
        setIsAiLoading(false);
    }
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
            onSaveImage={handleSaveImage}
            showSectionNames={showSectionNames}
            onToggleShowSectionNames={() => setShowSectionNames(prev => !prev)}
            showClassTypes={showClassTypes}
            onToggleShowClassTypes={() => setShowClassTypes(prev => !prev)}
          />
           {(excludedCoursesForThisSchedule.length > 0 || (conflictForThisSchedule && includedCoursesInSchedule.length === courses.filter(c => c.isEnabled).length)) && (
            <Alert variant="destructive" className="mt-4 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive-foreground/90" />
              <AlertTitle className="font-bold text-foreground">
                { excludedCoursesForThisSchedule.length > 0 ? "Partial Schedule Generated" : "Potential Conflict Detected"}
              </AlertTitle>
              <AlertDescription className="text-foreground/90 space-y-1">
                 {conflictForThisSchedule ? (
                    <p>
                      A full schedule could not be created because <span className="font-semibold">{conflictForThisSchedule.courses.map(c => c.name).join(' and ')}</span> have a <span className="font-semibold">{conflictForThisSchedule.type} conflict</span>.
                    </p>
                 ) : (
                    <p>A full schedule could not be generated with all selected courses.</p>
                 )}
                 {excludedCoursesForThisSchedule.length > 0 && (
                    <p>This schedule was created by excluding: <strong className="font-semibold">{excludedCoursesForThisSchedule.map(c => c.name).join(', ')}</strong>.</p>
                 )}
              </AlertDescription>
              {conflictForThisSchedule && (
                <div className="mt-4">
                    <Button onClick={handleGetAiSuggestions} disabled={isAiLoading} size="sm">
                        {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Get AI Suggestions
                    </Button>
                </div>
              )}
            </Alert>
          )}

           {isAiLoading && (
            <div className="mt-4 flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Thinking of suggestions...
            </div>
          )}

          {aiSuggestions.length > 0 && !isAiLoading && (
             <Alert className="mt-4 bg-primary/10 border-primary/50">
               <Sparkles className="h-4 w-4 text-primary/80" />
              <AlertTitle className="font-bold text-foreground">Heads up! Here are some suggestions:</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {aiSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <ScheduleView
            ref={scheduleRef}
            courses={includedCoursesInSchedule}
            schedule={currentSchedule}
            showSectionNames={showSectionNames}
            showClassTypes={showClassTypes}
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
        {conflicts.length > 0 && (
            <div className="mt-6">
                <Button onClick={handleGetAiSuggestions} disabled={isAiLoading}>
                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Get AI Help
                </Button>
            </div>
        )}
        <Button onClick={() => router.push('/editor')} className="mt-4" variant="outline">
          Go Back and Edit Courses
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
       <header className="py-6 px-4 md:px-8 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
            <Logo />
            <div className="flex items-center gap-2 md:gap-4">
              <ThemeToggle />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" onClick={() => router.push('/editor')}>
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

      <footer className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          © 2025 Sulaiman Alfaifi — All rights reserved
        </p>
      </footer>
    </div>
  );
}
