"use client";

import React from 'react';
import type { Course, Schedule, SectionTime, Day } from '@/lib/types';
import { ALL_DAYS } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleViewProps {
  courses: Course[];
  schedule: Schedule;
  lockedSections: {}; // Simplified for now
  onLockToggle: (courseId: string, sectionType: 'lecture' | 'lab') => void;
  onSectionChange: (courseId: string, newSectionId: string) => void; // This needs rethinking
}

const START_HOUR = 8;
const END_HOUR = 17;
const timeSlots = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => {
  const hour = START_HOUR + Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});

const timeToRow = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  const hoursFromStart = h - START_HOUR;
  return hoursFromStart * 2 + (m / 30) + 1;
};

export function ScheduleView({ courses, schedule, lockedSections, onLockToggle, onSectionChange }: ScheduleViewProps) {
  const scheduledItems: { course: Course; section: SectionTime; type: 'Lecture' | 'Lab' }[] = [];
  for (const courseId in schedule) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
        if (schedule[courseId].lecture) {
            scheduledItems.push({ course, section: course.lecture, type: 'Lecture' });
        }
        if (schedule[courseId].lab && course.lab) {
             scheduledItems.push({ course, section: course.lab, type: 'Lab' });
        }
    }
  }

  return (
    <div className="mt-8">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_repeat(5,1fr)] gap-px bg-border rounded-lg overflow-hidden border">
            {/* Corner */}
            <div className="bg-card p-2"></div>
            
            {/* Day Headers */}
            {ALL_DAYS.map(day => (
              <div key={day} className="bg-card text-center font-bold p-2 text-primary-foreground hidden md:block">{day}</div>
            ))}

            {/* Time Slots and Grid */}
            <div className="col-start-1 col-end-2 row-start-2 row-end-[21] grid grid-rows-18">
              {timeSlots.map(time => (
                <div key={time} className="text-right text-xs pr-2 text-muted-foreground bg-card relative -top-2">{time.endsWith('00') ? time : ''}</div>
              ))}
            </div>

            <div className="col-start-2 col-end-3 md:col-end-7 row-start-2 row-end-[21] grid grid-cols-1 md:grid-cols-5 grid-rows-[repeat(18,minmax(0,1fr))] gap-px relative">
              {/* Grid lines */}
              {timeSlots.slice(1).map((_, i) => (
                <div key={`h-line-${i}`} className="col-span-full h-px bg-border absolute w-full" style={{ top: `calc(${(100/18) * (i+1)}%)` }} />
              ))}
              {ALL_DAYS.slice(1).map((_, i) => (
                 <div key={`v-line-${i}`} className="row-span-full w-px bg-border absolute h-full hidden md:block" style={{ left: `calc(${(100/5) * (i+1)}%)` }} />
              ))}
              
              {/* Scheduled Items */}
              {scheduledItems.map(({ course, section, type }) => {
                const startRow = timeToRow(section.startTime);
                const endRow = timeToRow(section.endTime);
                // Locking logic simplified/disabled for now
                const isLocked = false; 

                return section.days.map(day => {
                  const dayIndex = ALL_DAYS.indexOf(day);
                  return (
                    <div
                      key={`${course.id}-${section.id}-${day}`}
                      className="md:col-start-auto row-span-1 md:row-span-1 rounded-lg p-2 md:p-3 flex flex-col justify-between relative overflow-hidden transition-all duration-300 ease-in-out"
                      style={{ 
                        gridColumnStart: dayIndex + 1,
                        gridRow: `${startRow} / ${endRow}`,
                        backgroundColor: course.color,
                      }}
                    >
                      <div>
                        <p className="font-bold text-sm md:text-base text-black/80">{course.name}</p>
                        <p className="text-xs md:text-sm text-black/70">{type}</p>
                      </div>
                      <div className="text-xs text-black/60 hidden md:block">
                        {section.startTime} - {section.endTime}
                      </div>
                       {/* Locking disabled for now
                      <button onClick={() => onLockToggle(course.id, type === 'Lecture' ? 'lecture' : 'lab')} className="absolute top-2 right-2 p-1 rounded-full bg-white/30 hover:bg-white/50 transition-colors">
                        {isLocked ? <Lock className="h-4 w-4 text-black/70"/> : <Unlock className="h-4 w-4 text-black/70"/>}
                      </button>
                      */}
                    </div>
                  );
                })
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bottom Section Summary */}
      <div className="mt-8">
        <h3 className="text-2xl font-headline font-bold mb-4">Course Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => {
            return(
              <Card key={course.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                      {course.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p><b>Lecture:</b> {course.lecture.days.join(', ')} {course.lecture.startTime}-{course.lecture.endTime}</p>
                    {course.lab && <p><b>Lab:</b> {course.lab.days.join(', ')} {course.lab.startTime}-{course.lab.endTime}</p>}
                  </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  );
}
