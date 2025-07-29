
"use client";

import React, { useMemo } from 'react';
import type { Course, Schedule, Section, Day } from '@/lib/types';
import { ALL_DAYS } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ScheduleViewProps {
  courses: Course[];
  schedule: Schedule;
  lockedSections: Record<string, string>;
  onLockToggle: (courseId: string, sectionId: string) => void;
  onSectionChange: (courseId: string, newSectionId: string) => void;
}

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToHour = (minutes: number): number => {
    return Math.floor(minutes / 60);
}

const ScheduledItemHorizontal = ({ course, section, startHour }: { course: Course, section: Section, startHour: number }) => {
    const timeToPosition = (time: string): number => {
        const [h, m] = time.split(':').map(Number);
        const hoursFromStart = h - startHour;
        return hoursFromStart * 2 + (m / 30);
    };

    const events = [];
    if (section.lecture) events.push({ type: 'Lecture', time: section.lecture });
    if (section.lab) events.push({ type: 'Lab', time: section.lab });

    return events.map(({ type, time }) => {
        return time.days.map(day => {
            const dayIndex = ALL_DAYS.indexOf(day);
            const startPos = timeToPosition(time.startTime);
            const endPos = timeToPosition(time.endTime);

            return (
                <div
                    key={`${course.id}-${section.id}-${day}-${type}`}
                    className="rounded-lg p-2 flex flex-col justify-between relative overflow-hidden text-black"
                    style={{
                        gridRowStart: dayIndex + 2,
                        gridColumn: `${startPos + 2} / ${endPos + 2}`,
                        backgroundColor: course.color,
                    }}
                >
                    <div>
                        <p className="font-bold text-sm text-black/80">{course.name}</p>
                        <p className="text-xs text-black/70">{section.name}</p>
                        <p className="text-xs text-black/70 font-semibold">{type}</p>
                    </div>
                    <div className="text-xs text-black/60 font-mono">
                        {time.startTime} - {time.endTime}
                    </div>
                </div>
            );
        });
    });
};


const HorizontalLayout = ({ scheduledItems, startHour, endHour }: { scheduledItems: { course: Course; section: Section; }[], startHour: number, endHour: number }) => {
    const timeSlots = Array.from({ length: (endHour - startHour) * 2 + 1}, (_, i) => {
        const hour = startHour + Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${String(hour).padStart(2, '0')}:${minute}`;
    });
    const gridColCount = timeSlots.length -1;

    return (
        <div className="grid grid-rows-[auto_repeat(5,1fr)] gap-px bg-border rounded-lg overflow-hidden border">
            {/* Corner */}
            <div className="bg-card p-2"></div>
            {/* Time Headers */}
            {timeSlots.map((time, index) => (
               <div key={time} className="bg-card text-center font-bold p-2 text-primary-foreground text-xs relative" style={{gridColumnStart: index + 2}}>
                {time.endsWith('00') ? time : ''}
               </div>
            ))}

            {/* Day Headers and Grid */}
            {ALL_DAYS.map((day, dayIndex) => (
                <React.Fragment key={day}>
                    <div className="row-start-auto col-start-1 bg-card text-right text-sm p-2 font-bold text-primary-foreground sticky left-0">{day}</div>
                    {dayIndex < ALL_DAYS.length -1 && <div className="col-start-2 col-span-full h-px bg-border" style={{ gridRowStart: dayIndex + 2 }} />}
                </React.Fragment>
            ))}
            
            {/* Vertical Lines */}
            {timeSlots.slice(0, -1).map((_, i) => (
                 <div key={`v-line-${i}`} className="row-span-full h-full w-px bg-border absolute" style={{ gridRowStart: 2, gridColumnStart:i+2 }} />
            ))}

            <div className="col-start-2 col-end-[--grid-col-end] row-start-2 row-end-7 grid grid-rows-5 grid-cols-[--grid-cols] relative" style={{'--grid-col-end': gridColCount + 2, '--grid-cols': `repeat(${gridColCount},minmax(0,1fr))` } as React.CSSProperties}>
              {scheduledItems.map(item => <ScheduledItemHorizontal key={`${item.course.id}-${item.section.id}`} {...item} startHour={startHour} />)}
            </div>
        </div>
    );
}

export function ScheduleView({ courses, schedule }: ScheduleViewProps) {
  const scheduledItems: { course: Course; section: Section; }[] = useMemo(() => {
    const items: { course: Course; section: Section; }[] = [];
    for (const courseId in schedule) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        const section = course.sections.find(s => s.id === schedule[courseId].sectionId);
        if (section) {
          items.push({ course, section });
        }
      }
    }
    return items;
  }, [courses, schedule]);
  
  const {startHour, endHour} = useMemo(() => {
    if(scheduledItems.length === 0) {
        return { startHour: 8, endHour: 17 };
    }

    let minMinute = 24 * 60;
    let maxMinute = 0;

    scheduledItems.forEach(({section}) => {
        const times = [section.lecture];
        if(section.lab) times.push(section.lab);

        times.forEach(time => {
            if (!time) return;
            const start = timeToMinutes(time.startTime);
            const end = timeToMinutes(time.endTime);
            if(start < minMinute) minMinute = start;
            if(end > maxMinute) maxMinute = end;
        })
    });
    
    let startH = Math.max(0, minutesToHour(minMinute) - 1);
    let endH = Math.min(24, minutesToHour(maxMinute) + 2);

    if (endH - startH < 4) {
      endH = startH + 4;
    }
    
    if (endH > 24) endH = 24;

    return {startHour: startH, endHour: endH};
  }, [scheduledItems]);

  const renderSummary = () => (
    <div className="mt-8">
      <Card>
          <CardHeader>
            <CardTitle>Course Summary</CardTitle>
            <CardDescription>Details for the currently displayed schedule.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledItems.map(({ course, section }) => (
              <Card key={`${course.id}-${section.id}`} className="flex items-start gap-4 p-4">
                 <div className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                <div>
                  <h4 className="font-bold">{course.name}</h4>
                  <p className="text-sm text-muted-foreground">{section.name}</p>
                  <div className="text-xs mt-2 space-y-1 text-muted-foreground">
                      <p><b>Lecture:</b> {section.lecture.days.join(', ')} {section.lecture.startTime}-{section.lecture.endTime}</p>
                      {section.lab && <p><b>Lab:</b> {section.lab.days.join(', ')} {section.lab.startTime}-{section.lab.endTime}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="mt-8">
      <Card>
        <CardContent className="p-4 md:p-6 overflow-x-auto">
          <HorizontalLayout scheduledItems={scheduledItems} startHour={startHour} endHour={endHour} />
        </CardContent>
      </Card>
      
      {renderSummary()}
    </div>
  );
}
