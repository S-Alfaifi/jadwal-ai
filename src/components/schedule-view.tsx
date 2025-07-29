
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

const ScheduledItemHorizontal = ({ event, startHour }: { event: PositionedEvent, startHour: number }) => {
    const timeToPosition = (time: number): number => {
        const hoursFromStart = Math.floor(time / 60) - startHour;
        return hoursFromStart * 2 + ((time % 60) / 30);
    };

    const startPos = timeToPosition(event.startMinutes);
    const endPos = timeToPosition(event.endMinutes);
    const dayIndex = ALL_DAYS.indexOf(event.day);
    
    return (
        <div
            key={`${event.course.id}-${event.section.id}-${event.day}-${event.type}`}
            className="rounded-lg p-2 flex flex-col justify-center relative overflow-hidden text-black"
            style={{
                gridRowStart: dayIndex + 1,
                gridRowEnd: dayIndex + 2,
                gridColumn: `${startPos + 1} / ${endPos + 1}`,
                backgroundColor: event.course.color,
                zIndex: 10,
                marginTop: `${event.track * 2}px`,
                marginBottom: `${event.track * 2}px`,
            }}
        >
            <div>
                <p className="font-bold text-sm text-black/80">{event.course.name}</p>
                <p className="text-xs text-black/70">{event.section.name}</p>
                <p className="text-xs text-black/70 font-semibold">{event.type}</p>
            </div>
            <div className="text-xs text-black/60 font-mono mt-1">
                {event.time.startTime} - {event.time.endTime}
            </div>
        </div>
    );
};

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
                time.days.forEach(day => {
                    allEvents.push({
                        course,
                        section,
                        type,
                        time,
                        day,
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

        allEvents.sort((a,b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes).forEach(event => {
            let placed = false;
            for(let trackIndex = 0; trackIndex < dayTracks[event.day].length; trackIndex++) {
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
            if(!placed){
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
        <div className="grid border-r border-b" style={{
            gridTemplateColumns: `auto repeat(${gridColCount}, minmax(0, 1fr))`,
            gridTemplateRows: `auto ${ALL_DAYS.map(day => `repeat(${dayTrackCounts[day]}, minmax(80px, auto))`).join(' ')}`,
        }}>
            {/* Corner */}
            <div className="bg-card p-2 border-l border-t sticky left-0 z-20"></div>
            {/* Time Headers */}
            {timeSlots.map((time) => (
               <div key={time} className="bg-card text-center font-bold p-2 text-primary-foreground text-xs border-t border-l">
                {time.endsWith('00') ? time : ''}
               </div>
            ))}

            {/* Day Headers and Grid */}
            {ALL_DAYS.map((day, dayIndex) => {
                 const dayRowStart = ALL_DAYS.slice(0, dayIndex).reduce((acc, curr) => acc + dayTrackCounts[curr], 0) + 2;
                 const dayRowEnd = dayRowStart + dayTrackCounts[day];

                return (
                    <React.Fragment key={day}>
                        <div className="bg-card text-right text-sm p-2 font-bold text-primary-foreground sticky left-0 z-20 border-l border-t" style={{ gridRow: `${dayRowStart} / ${dayRowEnd}`}}>
                           <div className="sticky top-0">{day}</div>
                        </div>
                        
                        {/* Horizontal lines for each track */}
                        {Array.from({length: dayTrackCounts[day]}).map((_, trackIndex) => (
                           <div key={`${day}-${trackIndex}`} className="col-start-2 col-end-[-1] border-l border-t" style={{ gridRow: dayRowStart + trackIndex, gridColumn: `1 / ${gridColCount + 2}`}}></div>
                        ))}

                    </React.Fragment>
                )
            })}
            
            {/* Vertical Lines */}
            {timeSlots.slice(1).map((_, i) => (
                 <div key={`v-line-${i}`} className="row-start-2 row-end-[-1] col-start-${i+2} h-full w-px bg-border" style={{ gridColumn: i + 2, gridRow: `2 / -1`}} />
            ))}
            
            <div className="col-start-2 col-end-[-1] row-start-2 row-end-[-1] grid relative" style={{
                gridTemplateColumns: `repeat(${gridColCount}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${ALL_DAYS.reduce((acc, curr) => acc + dayTrackCounts[curr], 0)}, 1fr)`,
             } as React.CSSProperties}>
              {positionedEvents.map((item, idx) => {
                    const dayRowStart = ALL_DAYS.slice(0, ALL_DAYS.indexOf(item.day)).reduce((acc, curr) => acc + dayTrackCounts[curr], 0);
                    const startPos = timeToMinutes(item.time.startTime);
                    const endPos = timeToMinutes(item.time.endTime);
                    const startCol = ((startPos - startHour * 60) / 30);
                    const endCol = ((endPos - startHour * 60) / 30);
                    
                    return (
                        <div
                            key={`${item.course.id}-${item.section.id}-${item.day}-${item.type}`}
                            className="rounded-lg p-2 flex flex-col justify-center relative overflow-hidden text-black m-px"
                            style={{
                                gridRowStart: dayRowStart + item.track + 1,
                                gridColumn: `${startCol + 1} / ${endCol + 1}`,
                                backgroundColor: item.course.color,
                                zIndex: 10,
                            }}
                        >
                             <div>
                                <p className="font-bold text-sm text-black/80">{item.course.name}</p>
                                <p className="text-xs text-black/70">{item.section.name}</p>
                                <p className="text-xs text-black/70 font-semibold">{item.type}</p>
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
    
    // Ensure endH is a clean hour boundary if maxMinute isn't on the hour
    if (maxMinute % 60 !== 0) {
      endH = Math.ceil(maxMinute / 60) + 1;
    } else {
      endH = (maxMinute/60) + 1;
    }
    
    startH = Math.floor(minMinute/60);


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
