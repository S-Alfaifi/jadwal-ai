"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ScheduleView } from '@/components/schedule-view';
import { ScheduleControls } from '@/components/schedule-controls';
import { AiSuggestions } from '@/components/ai-suggestions';
import { Logo } from '@/components/logo';
import type { Course, Schedule, SectionTime } from '@/lib/types';
import { generateSchedules } from '@/lib/scheduler';
import { suggestScheduleWorkarounds } from '@/ai/flows/suggest-schedule-workarounds';

export default function SchedulePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  // Locking is disabled with the new data structure for now.
  const [lockedSections, setLockedSections] = useState({});
  
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
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

  useEffect(() => {
    if (courses.length > 0) {
      runScheduler();
    }
  }, [courses]); // lockedSections removed for now

  const runScheduler = async () => {
    setIsLoading(true);
    setAiSuggestions(null);
    const generated = generateSchedules(courses, lockedSections);

    if (generated.length > 0) {
      setSchedules(generated);
      setCurrentScheduleIndex(0);
    } else {
      setSchedules([]);
      setIsAiLoading(true);
      try {
        const formattedCourses = courses.map(c => {
            const sections = [c.lecture].concat(c.lab ? [c.lab] : []).map((s, index) => ({
                days: s.days.map(d => d as 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu'),
                startTime: s.startTime,
                endTime: s.endTime,
                type: (index === 0 ? 'Lecture' : 'Lab') as 'Lecture' | 'Lab',
            }));

            return {
                name: c.name,
                sections: sections,
            }
        });
        const result = await suggestScheduleWorkarounds({ courses: formattedCourses });
        setAiSuggestions(result.suggestions);
      } catch (error) {
        console.error("AI suggestion failed:", error);
        setAiSuggestions(["Could not fetch AI suggestions at this time."]);
      } finally {
        setIsAiLoading(false);
      }
    }
    setIsLoading(false);
  };
  
  const currentSchedule = useMemo(() => schedules[currentScheduleIndex], [schedules, currentScheduleIndex]);

  // Locking and section changing is more complex now, disabling for this refactor.
  const handleLockSection = (courseId: string, sectionId: string) => {};
  const handleSectionChange = (courseId: string, newSectionId: string) => {};

  if (!isMounted) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;

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
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-lg text-muted-foreground">Generating schedules...</p>
          </div>
        ) : (
          <>
            <ScheduleControls
              current={currentScheduleIndex + 1}
              total={schedules.length}
              onNext={() => setCurrentScheduleIndex(i => (i + 1) % schedules.length)}
              onPrev={() => setCurrentScheduleIndex(i => (i - 1 + schedules.length) % schedules.length)}
              onRegenerate={runScheduler}
              disableSemesterSplit={true}
            />

            {schedules.length > 0 && currentSchedule ? (
              <ScheduleView
                courses={courses}
                schedule={currentSchedule}
                lockedSections={lockedSections}
                onLockToggle={handleLockSection}
                onSectionChange={handleSectionChange}
              />
            ) : isAiLoading ? (
                 <div className="flex items-center justify-center min-h-[60vh] flex-col">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-lg text-muted-foreground">No direct schedules found. Consulting AI for workarounds...</p>
                </div>
            ) : aiSuggestions ? (
              <AiSuggestions suggestions={aiSuggestions} />
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 px-8 bg-card rounded-lg border-2 border-dashed min-h-[60vh]">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <h3 className="mt-4 text-xl font-bold text-primary-foreground">No Schedules Found</h3>
                    <p className="mt-2 text-base text-muted-foreground">
                    We couldn't generate a conflict-free schedule with the provided courses and sections.
                    </p>
                     <Button onClick={() => router.push('/')} className="mt-6">
                        Go Back and Edit Courses
                    </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
