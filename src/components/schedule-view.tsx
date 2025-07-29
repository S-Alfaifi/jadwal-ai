
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
}

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToHour = (minutes: number): number => {
    return Math.floor(minutes / 60);
}

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
    const gridColCount = timeSlots.length;

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
            const maxTrack = Math.max(0, ...eventsOnDay.map(e => e.track));
            counts[day] = maxTrack + 1;
        });
        return counts;
    }, [positionedEvents]);

    return (
        <div className="grid border-r border-b" style={{ gridTemplateColumns: `auto repeat(${gridColCount}, minmax(0, 1fr))` }}>
            {/* Corner */}
            <div className="bg-card p-2 border-l border-t sticky left-0 z-20"></div>

            {/* Time Headers */}
            {timeSlots.map((time, index) => (
                <div key={time} className="text-center p-2 text-xs font-medium text-muted-foreground border-t border-l" style={{
                    gridColumn: index + 2,
                    gridRow: 1
                }}>
                    {time.endsWith('00') ? time : ''}
                </div>
            ))}
            
            {/* Day Rows and Events */}
            {ALL_DAYS.map((day, dayIndex) => {
                const eventsOnDay = positionedEvents.filter(e => e.day === day);
                const trackCount = Math.max(1, dayTrackCounts[day] || 1);
                
                const dayRowStart = ALL_DAYS.slice(0, dayIndex).reduce((acc, currentDay) => acc + (dayTrackCounts[currentDay] || 1), 0) + 2;
                
                return (
                    <React.Fragment key={day}>
                        {/* Day Header */}
                         <div className="bg-card text-right text-sm p-2 font-bold text-primary-foreground sticky left-0 z-20 border-l border-t flex items-center justify-center" style={{ gridRow: `${dayRowStart} / span ${trackCount}` }}>
                            <span className="-rotate-90 whitespace-nowrap">{day}</span>
                        </div>

                        {/* Grid area for the day */}
                        <div className="col-start-2 col-end-[-1] grid border-t border-l" style={{
                            gridRow: `${dayRowStart} / span ${trackCount}`,
                            gridTemplateColumns: `repeat(${gridColCount}, minmax(0, 1fr))`,
                            gridTemplateRows: `repeat(${trackCount}, minmax(70px, auto))`,
                        }}>
                             {/* Vertical lines */}
                            {timeSlots.slice(1).map((_, i) => (
                                <div key={`v-line-${day}-${i}`} className="h-full w-px bg-border" style={{ gridColumn: i + 1, gridRow: `1 / span ${trackCount}`}} />
                            ))}

                            {eventsOnDay.map((item) => {
                                const startCol = ((timeToMinutes(item.time.startTime) - startHour * 60) / 30);
                                const endCol = ((timeToMinutes(item.time.endTime) - startHour * 60) / 30);
                                
                                return (
                                    <div
                                        key={`${item.course.id}-${item.section.id}-${item.day}-${item.type}`}
                                        className="rounded-lg p-2 flex flex-col justify-center relative overflow-hidden text-black m-px shadow-sm"
                                        style={{
                                            gridRowStart: item.track + 1,
                                            gridColumn: `${startCol + 1} / span ${endCol - startCol}`,
                                            backgroundColor: item.course.color,
                                            zIndex: 10,
                                        }}
                                    >
                                        <div>
                                            <p className="font-bold text-sm text-black/80">{item.course.name}</p>
                                            <p className="text-xs text-black/70">{item.section.name} ({item.type})</p>
                                        </div>
                                        <div className="text-xs text-black/60 font-mono mt-1">
                                            {item.time.startTime} - {item.time.endTime}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </React.Fragment>
                );
            })}
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
    
    let startH = Math.floor(minMinute/60);
    let endH = Math.ceil(maxMinute/60);

    // Add padding
    startH = Math.max(0, startH - 1);
    endH = Math.min(24, endH + 1);

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
        <CardContent className="p-0 md:p-0 overflow-x-auto">
           <HorizontalLayout scheduledItems={scheduledItems} startHour={startHour} endHour={endHour} />
        </CardContent>
      </Card>
      
      {renderSummary()}
    </div>
  );
}
