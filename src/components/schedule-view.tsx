"use client";

import React from 'react';
import type { Course, Schedule, Section, Day } from '@/lib/types';
import { ALL_DAYS } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from './ui/button';
import { Lock, Unlock, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleViewProps {
  courses: Course[];
  schedule: Schedule;
  lockedSections: Schedule;
  onLockToggle: (courseId: string, sectionId: string) => void;
  onSectionChange: (courseId: string, newSectionId: string) => void;
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
  const scheduledItems: { course: Course; section: Section }[] = [];
  for (const courseId in schedule) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const section = course.sections.find(s => s.id === schedule[courseId]);
      if (section) {
        scheduledItems.push({ course, section });
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
              {scheduledItems.map(({ course, section }) => {
                const startRow = timeToRow(section.startTime);
                const endRow = timeToRow(section.endTime);
                const isLocked = lockedSections[course.id] === section.id;

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
                        <p className="text-xs md:text-sm text-black/70">{section.type}</p>
                      </div>
                      <div className="text-xs text-black/60 hidden md:block">
                        {section.startTime} - {section.endTime}
                      </div>
                      <button onClick={() => onLockToggle(course.id, section.id)} className="absolute top-2 right-2 p-1 rounded-full bg-white/30 hover:bg-white/50 transition-colors">
                        {isLocked ? <Lock className="h-4 w-4 text-black/70"/> : <Unlock className="h-4 w-4 text-black/70"/>}
                      </button>
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
        <h3 className="text-2xl font-headline font-bold mb-4">Selected Sections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => {
            const currentSectionId = schedule[course.id];
            const isLocked = lockedSections[course.id] === currentSectionId;
            return(
              <Card key={course.id} className={cn("transition-all", isLocked && "border-primary border-2")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                      {course.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select
                      value={currentSectionId}
                      onValueChange={(newSectionId) => onSectionChange(course.id, newSectionId)}
                      disabled={isLocked}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a section" />
                      </SelectTrigger>
                      <SelectContent>
                        {course.sections.map((section, index) => (
                          <SelectItem key={section.id} value={section.id}>
                            Section {index + 1} ({section.days.join(', ')}) {section.startTime}-{section.endTime}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => onLockToggle(course.id, currentSectionId)}>
                      {isLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                      {isLocked ? "Unlock Section" : "Lock Section"}
                    </Button>
                  </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  );
}
