
"use client";

import React, { useMemo } from 'react';
import type { Course, Schedule, Section, Day, SectionTime } from '@/lib/types';
import { ALL_DAYS } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ScheduleViewProps {
  courses: Course[];
  schedule: Schedule;
  lockedSections: Record<string, string>;
  onLockToggle: (courseId: string, sectionId: string) => void;
  onSectionChange: (courseId: string, newSectionId: string) => void;
  layout: 'horizontal';
}

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

interface PositionedEvent {
    course: Course;
    section: Section;
    type: 'Lecture' | 'Lab';
    time: SectionTime;
    day: Day;
    startMinutes: number;
    endMinutes: number;
    track: number;
}

const HorizontalLayout = ({ scheduledItems, startHour, endHour }: { scheduledItems: { course: Course; section: Section; }[], startHour: number, endHour: number }) => {
    const timeSlots = Array.from({ length: (endHour - startHour) * 2 }, (_, i) => {
        const hour = startHour + Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${String(hour).padStart(2, '0')}:${minute}`;
    });

    const positionedEvents = useMemo(() => {
        const allEvents: Omit<PositionedEvent, 'track'>[] = [];
        scheduledItems.forEach(({ course, section }) => {
            const processTime = (type: 'Lecture' | 'Lab', time: SectionTime) => {
                if (!time) return;
                time.days.forEach(day => {
                    allEvents.push({
                        course, section, type, time, day,
                        startMinutes: timeToMinutes(time.startTime),
                        endMinutes: timeToMinutes(time.endTime),
                    });
                });
            };
            processTime('Lecture', section.lecture);
            if (section.lab) processTime('Lab', section.lab);
        });

        const finalEvents: PositionedEvent[] = [];
        const dayTracks: Record<string, PositionedEvent[][]> = {};
        ALL_DAYS.forEach(day => { dayTracks[day] = []; });

        allEvents.sort((a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes).forEach(event => {
            let placed = false;
            for (let trackIndex = 0; trackIndex < dayTracks[event.day].length; trackIndex++) {
                const track = dayTracks[event.day][trackIndex];
                const hasConflict = track.some(existingEvent =>
                    event.startMinutes < existingEvent.endMinutes && event.endMinutes > existingEvent.startMinutes
                );
                if (!hasConflict) {
                    track.push(event as PositionedEvent);
                    (event as PositionedEvent).track = trackIndex;
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                const newTrackIndex = dayTracks[event.day].length;
                dayTracks[event.day].push([event as PositionedEvent]);
                (event as PositionedEvent).track = newTrackIndex;
            }
            finalEvents.push(event as PositionedEvent);
        });

        return finalEvents;
    }, [scheduledItems]);
    
    const dayTrackCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        ALL_DAYS.forEach(day => {
            const eventsOnDay = positionedEvents.filter(e => e.day === day);
            if(eventsOnDay.length === 0) {
                 counts[day] = 1;
                 return;
            }
            const maxTrack = Math.max(0, ...eventsOnDay.map(e => e.track));
            counts[day] = maxTrack + 1;
        });
        return counts;
    }, [positionedEvents]);

    return (
        <div className="grid grid-cols-[auto,1fr] bg-background font-sans">
            {/* Top-left empty cell */}
            <div className="sticky left-0 top-0 z-30 bg-card border-b border-r"></div>
            
            {/* Time Headers */}
            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${timeSlots.length}, 6rem)`}}>
                 {timeSlots.map((time) => (
                    <div key={time} className="text-center p-2 text-xs font-medium text-muted-foreground border-b border-r" >
                        {time.endsWith('00') ? time : ''}
                    </div>
                ))}
            </div>


            {/* Day Rows and Events */}
            <div className="sticky left-0 z-20 flex flex-col">
                {ALL_DAYS.map((day) => (
                    <div key={day} className="flex-grow flex items-center justify-center p-2 font-bold text-primary-foreground bg-card border-b border-r" style={{minHeight: `${dayTrackCounts[day] * 70}px`}}>
                       {day}
                    </div>
                ))}
            </div>

            <div className="relative grid auto-rows-[70px]" style={{ gridTemplateColumns: `repeat(${timeSlots.length}, 6rem)`}}>
                {/* Background Grid Lines */}
                {ALL_DAYS.map((day, dayIndex) => {
                     const totalTracksBefore = ALL_DAYS.slice(0, dayIndex).reduce((acc, curr) => acc + dayTrackCounts[curr], 0);
                     const rowStart = totalTracksBefore + 1;
                     const rowEnd = totalTracksBefore + dayTrackCounts[day] + 1;
                     return Array.from({length: timeSlots.length}).map((_, timeIndex) => (
                        <div key={`${day}-${timeIndex}`} className="border-r border-b" style={{
                            gridRowStart: rowStart,
                            gridRowEnd: rowEnd,
                            gridColumn: timeIndex + 1,
                        }}/>
                     ))
                })}

                {/* Events */}
                {positionedEvents.map((item) => {
                    const startCol = ((timeToMinutes(item.time.startTime) - startHour * 60) / 30);
                    const endCol = ((timeToMinutes(item.time.endTime) - startHour * 60) / 30);
                    const dayIndex = ALL_DAYS.indexOf(item.day);
                    const totalTracksBefore = ALL_DAYS.slice(0, dayIndex).reduce((acc, curr) => acc + dayTrackCounts[curr], 0);
                    const rowStart = totalTracksBefore + item.track + 1;

                    return (
                        <div
                            key={`${item.course.id}-${item.section.id}-${item.day}-${item.type}`}
                            className="rounded-lg p-2 flex flex-col justify-center relative overflow-hidden text-black m-px shadow-sm"
                            style={{
                                gridRow: `${rowStart} / span 1`,
                                gridColumn: `${startCol + 1} / span ${endCol - startCol}`,
                                backgroundColor: item.course.color,
                                zIndex: 10,
                            }}
                             title={`${item.course.name} - ${item.section.name} (${item.type})\n${item.time.startTime} - ${item.time.endTime}`}>
                            <div>
                                <p className="font-bold text-sm text-black/80 truncate">{item.course.name}</p>
                                <p className="text-xs text-black/70 truncate">{item.section.name} ({item.type})</p>
                            </div>
                            <div className="text-xs text-black/60 font-mono mt-1">
                                {item.time.startTime} - {item.time.endTime}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function ScheduleView({ courses, schedule }: ScheduleViewProps) {
  const scheduledItems: { course: Course; section: Section; }[] = useMemo(() => {
    const items: { course: Course; section: Section; }[] = [];
    if (!schedule) return items;
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
    
    const startH = Math.floor(minMinute/60);
    const endH = Math.ceil(maxMinute/60);

    return {startHour: startH, endHour: Math.max(endH, startH + 1)};
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
        <CardContent className="p-0 overflow-x-auto">
            <HorizontalLayout scheduledItems={scheduledItems} startHour={startHour} endHour={endHour} /> 
        </CardContent>
      </Card>
      
      {renderSummary()}
    </div>
  );
}
