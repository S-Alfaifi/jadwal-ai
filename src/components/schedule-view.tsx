
"use client";

import React from 'react';
import type { Course, Schedule, Section, Day, LayoutDirection } from '@/lib/types';
import { ALL_DAYS } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ScheduleViewProps {
  courses: Course[];
  schedule: Schedule;
  lockedSections: Record<string, string>;
  onLockToggle: (courseId: string, sectionId: string) => void;
  onSectionChange: (courseId: string, newSectionId: string) => void;
  layout: LayoutDirection;
}

const START_HOUR = 8;
const END_HOUR = 17; // Represents the end of the 16:00 hour, so up to 17:00
const timeSlots = Array.from({ length: (END_HOUR - START_HOUR) * 2 + 1 }, (_, i) => {
  const hour = START_HOUR + Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});

const timeToPosition = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  const hoursFromStart = h - START_HOUR;
  return hoursFromStart * 2 + (m / 30);
};

const ScheduledItem = ({ course, section }: { course: Course, section: Section }) => {
  const events = [];
  if (section.lecture) events.push({ type: 'Lecture', time: section.lecture });
  if (section.lab) events.push({ type: 'Lab', time: section.lab });

  return events.map(({ type, time }) => {
    const startPos = timeToPosition(time.startTime);
    const endPos = timeToPosition(time.endTime);

    return time.days.map(day => {
      const dayIndex = ALL_DAYS.indexOf(day);
      return (
        <div
          key={`${course.id}-${section.id}-${day}-${type}`}
          className="rounded-lg p-2 flex flex-col justify-between relative overflow-hidden text-black"
          style={{
            gridColumnStart: dayIndex + 2,
            gridRow: `${startPos + 2} / ${endPos + 2}`,
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

const VerticalLayout = ({ scheduledItems }: { scheduledItems: { course: Course; section: Section; }[] }) => (
  <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-px bg-border rounded-lg overflow-hidden border">
    {/* Corner */}
    <div className="bg-card p-2"></div>
    {/* Day Headers */}
    {ALL_DAYS.map(day => (
      <div key={day} className="bg-card text-center font-bold p-2 text-primary-foreground">{day}</div>
    ))}

    {/* Time Slots and Grid */}
    {timeSlots.map((time, index) => (
      <React.Fragment key={time}>
        <div className="row-start-auto col-start-1 bg-card text-right text-xs pr-2 text-muted-foreground relative -top-2">{time.endsWith('00') ? time : ''}</div>
        {index < timeSlots.length - 1 && <div className="col-start-2 col-span-5 h-px bg-border" />}
      </React.Fragment>
    ))}

    <div className="col-start-2 col-end-7 row-start-2 row-end-[_100_] grid grid-cols-5 grid-rows-[repeat(19,minmax(0,1fr))] relative">
        {ALL_DAYS.slice(0, -1).map((_, i) => (
            <div key={`v-line-${i}`} className="row-span-full w-px bg-border absolute h-full" style={{ left: `calc(${(100/5) * (i+1)}%)` }} />
        ))}
        {scheduledItems.map(item => <ScheduledItem key={item.section.id} {...item} />)}
    </div>
  </div>
);


const HorizontalLayout = ({ scheduledItems }: { scheduledItems: { course: Course; section: Section; }[] }) => {
  const numTimeSlots = (END_HOUR - START_HOUR) * 2;
  const timeLabels = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <div className="grid grid-rows-[auto_repeat(5,minmax(6rem,auto))] grid-cols-[auto_1fr] gap-px bg-border rounded-lg overflow-hidden border">
        {/* Corner */}
        <div className="bg-card p-2 row-start-1 col-start-1"></div>

        {/* Time Headers */}
        <div className="bg-card p-2 row-start-1 col-start-2 grid relative" style={{ gridTemplateColumns: `repeat(${timeLabels.length -1}, 1fr)` }}>
            {timeLabels.map((hour, index) => (
                 <div key={hour} className="text-center text-xs font-medium text-muted-foreground" style={{ gridColumn: `${index + 1}` }}>
                    {`${hour}:00`}
                </div>
            ))}
        </div>

        {/* Day Headers */}
        {ALL_DAYS.map((day) => (
            <div key={day} className="bg-card text-center font-bold p-4 text-primary-foreground flex items-center justify-center">{day}</div>
        ))}
        
        {/* Grid Content */}
        <div className="row-start-2 row-span-5 col-start-2 grid grid-rows-5 relative" >
             {/* Horizontal lines */}
            {ALL_DAYS.slice(0, -1).map((_, i) => (
                <div key={`h-line-${i}`} className="col-span-full h-px bg-border absolute w-full" style={{ top: `calc(${(100/5) * (i+1)}%)` }} />
            ))}
            {/* Vertical lines */}
            {Array.from({length: numTimeSlots}, (_, i) => (
                 <div key={`v-line-${i}`} className={cn("row-span-full w-px absolute h-full", i % 2 === 0 ? "bg-border" : "bg-border/50")} style={{ left: `calc(${(100/numTimeSlots) * i}%)` }} />
            ))}

            {/* Scheduled Items */}
            <div className="row-start-1 row-span-5 col-start-1 col-span-1 grid h-full p-1 gap-1" style={{gridTemplateRows: 'repeat(5, 1fr)', gridTemplateColumns: `repeat(${numTimeSlots}, 1fr)`}}>
                {scheduledItems.map(({ course, section }) => {
                    const events = [];
                    if(section.lecture) events.push({type: 'Lecture', time: section.lecture});
                    if(section.lab) events.push({type: 'Lab', time: section.lab});

                    return events.map(({ type, time }) => {
                        return time.days.map(day => {
                            const dayIndex = ALL_DAYS.indexOf(day);
                            const startPos = timeToPosition(time.startTime);
                            const endPos = timeToPosition(time.endTime);

                            return (
                              <div
                                key={`${course.id}-${section.id}-${day}-${type}`}
                                className="rounded-md p-2 flex flex-col justify-center relative overflow-hidden text-black shadow-sm"
                                style={{ 
                                  gridRowStart: dayIndex + 1,
                                  gridColumn: `${startPos + 1} / ${endPos + 1}`,
                                  backgroundColor: course.color,
                                }}
                              >
                                <p className="font-bold text-sm text-black/80 leading-tight">{course.name}</p>
                                <p className="text-xs text-black/70">{section.name} ({type})</p>
                                <p className="text-xs text-black/60 font-mono mt-1">{time.startTime}-{time.endTime}</p>
                              </div>
                            );
                        })
                    })
                })}
            </div>
        </div>
    </div>
  );
};


export function ScheduleView({ courses, schedule, layout }: ScheduleViewProps) {
  const scheduledItems: { course: Course; section: Section; }[] = [];
  for (const courseId in schedule) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const section = course.sections.find(s => s.id === schedule[courseId].sectionId);
      if (section) {
        scheduledItems.push({ course, section });
      }
    }
  }

  const renderSummary = () => (
    <div className="mt-8">
      <h3 className="text-2xl font-headline font-bold mb-4">Course Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scheduledItems.map(({ course, section }) => (
          <Card key={`${course.id}-${section.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                <h4 className="font-bold">{course.name}</h4>
              </div>
              <p className="text-sm text-muted-foreground">{section.name}</p>
              <div className="text-xs mt-2 space-y-1 text-muted-foreground">
                  <p><b>Lecture:</b> {section.lecture.days.join(', ')} {section.lecture.startTime}-{section.lecture.endTime}</p>
                  {section.lab && <p><b>Lab:</b> {section.lab.days.join(', ')} {section.lab.startTime}-{section.lab.endTime}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-8">
      <Card>
        <CardContent className="p-4 md:p-6 overflow-x-auto">
          {layout === 'vertical' ? 
            <VerticalLayout scheduledItems={scheduledItems} /> : 
            <HorizontalLayout scheduledItems={scheduledItems} />}
        </CardContent>
      </Card>
      
      {renderSummary()}
    </div>
  );
}
