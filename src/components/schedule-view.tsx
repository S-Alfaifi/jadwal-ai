
"use client";

import React, { useMemo, forwardRef, useRef, useImperativeHandle } from 'react';
import type { Course, Schedule, Section, Day, SectionTime } from '@/lib/types';
import { ALL_DAYS } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, FlaskConical } from 'lucide-react';

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

const HorizontalLayout = ({ scheduledItems, startHour, endHour, showSectionNames, showClassTypes, showClassroom }: { scheduledItems: { course: Course; section: Section; }[], startHour: number, endHour: number, showSectionNames: boolean, showClassTypes: boolean, showClassroom: boolean }) => {
    // Visual grid is 30-min intervals
    const visualTimeSlots = Array.from({ length: (endHour - startHour) * 2 }, (_, i) => {
        const hour = startHour + Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${String(hour).padStart(2, '0')}:${minute}`;
    });

    // Layout grid is 5-min intervals for precision
    const layoutInterval = 5; // minutes
    const columnsPerHour = 60 / layoutInterval;
    const totalColumns = (endHour - startHour) * columnsPerHour;

    const { positionedEvents, dayTrackCounts } = useMemo(() => {
        const allEvents: Omit<PositionedEvent, 'track'>[] = [];
        scheduledItems.forEach(({ course, section }) => {
            const processTime = (type: 'Lecture' | 'Lab', time: SectionTime | undefined) => {
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
            processTime('Lab', section.lab);
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
                    const positionedEvent = { ...event, track: trackIndex };
                    track.push(positionedEvent);
                    finalEvents.push(positionedEvent);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                const newTrackIndex = dayTracks[event.day].length;
                const positionedEvent = { ...event, track: newTrackIndex };
                dayTracks[event.day].push([positionedEvent]);
                finalEvents.push(positionedEvent);
            }
        });

        const counts: Record<string, number> = {};
        ALL_DAYS.forEach(day => {
            const eventsOnDay = finalEvents.filter(e => e.day === day);
            if(eventsOnDay.length === 0) {
                 counts[day] = 1;
                 return;
            }
            const maxTrack = Math.max(0, ...eventsOnDay.map(e => e.track));
            counts[day] = maxTrack + 1;
        });

        return { positionedEvents: finalEvents, dayTrackCounts: counts };
    }, [scheduledItems]);
    
    return (
        <div className="grid grid-cols-[auto_1fr] bg-background font-sans">
            {/* Top-left corner */}
            <div className="sticky left-0 top-0 z-30 flex items-center justify-center bg-background border-r border-b">
                <div className="text-xs font-medium text-muted-foreground p-2">Time</div>
            </div>
            
             {/* Time Headers (Visual Grid) */}
            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${visualTimeSlots.length}, minmax(4.5rem, 1fr))`}}>
                 {visualTimeSlots.map((time) => (
                    <div key={time} className="text-center p-2 text-[10px] md:text-xs font-medium text-muted-foreground border-r border-b" >
                        {time.endsWith('00') ? time : ''}
                    </div>
                ))}
            </div>
            
            <div className="sticky left-0 z-20 flex flex-col">
                {ALL_DAYS.map((day) => (
                    <div key={day} className="flex-grow flex items-center justify-center p-2 font-bold text-primary-foreground bg-background border-b border-r" style={{minHeight: `${dayTrackCounts[day] * 80}px`}}>
                       {day}
                    </div>
                ))}
            </div>

            {/* Schedule Grid Area (Layout Grid) */}
            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${totalColumns}, 1fr)`, gridTemplateRows: `repeat(${Object.values(dayTrackCounts).reduce((a,b) => a+b, 0)}, 80px)`}}>
                {/* Background Grid Cells (Visual Grid) */}
                {ALL_DAYS.map((day, dayIndex) => {
                    const dayRowStart = ALL_DAYS.slice(0, dayIndex).reduce((acc, d) => acc + dayTrackCounts[d], 0) + 1;
                    return Array.from({length: dayTrackCounts[day]}).map((_, trackIndex) => (
                         // We only need to render the visual grid lines (every 30 mins)
                        Array.from({length: visualTimeSlots.length}).map((_, timeIndex) => (
                            <div key={`${day}-${trackIndex}-${timeIndex}`} className="border-r border-b" style={{
                                gridRow: dayRowStart + trackIndex,
                                gridColumn: `${(timeIndex * columnsPerHour / 2) + 1} / span ${columnsPerHour / 2}`,
                                minHeight: '80px',
                            }}/>
                        ))
                    ))
                 })}

                {/* Positioned Event Items */}
                {positionedEvents.map((item, eventIndex) => {
                    const startCol = Math.floor((item.startMinutes - startHour * 60) / layoutInterval) + 1;
                    const endCol = Math.ceil((item.endMinutes - startHour * 60) / layoutInterval) + 1;

                    const dayRowStart = ALL_DAYS.slice(0, ALL_DAYS.indexOf(item.day)).reduce((acc, d) => acc + dayTrackCounts[d], 0) + 1;
                    const rowStart = dayRowStart + item.track;

                    const fullTitle = `${item.course.name} - ${item.section.name} (${item.type})\n${item.time.startTime} - ${item.time.endTime}`;

                    return (
                        <div
                            key={`${item.course.id}-${item.section.id}-${item.day}-${item.type}-${eventIndex}`}
                            className="rounded-lg p-2 flex flex-col justify-between relative text-black m-1 overflow-hidden"
                            style={{
                                gridRow: `${rowStart} / span 1`,
                                gridColumn: `${startCol} / ${endCol}`,
                                backgroundColor: item.course.color,
                                zIndex: 10,
                                minHeight: '72px'
                            }}>
                            <div className="flex flex-col" title={fullTitle}>
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                    <p className="font-bold text-sm text-black/90 truncate" title={item.course.name}>{item.course.name}</p>
                                     {showClassTypes && (
                                        <div className="flex items-center gap-1 font-code text-xs text-black/70 flex-shrink-0">
                                            {item.type === 'Lecture' 
                                                ? <BookText className="h-3 w-3" /> 
                                                : <FlaskConical className="h-3 w-3" />
                                            }
                                            <span>{item.type}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-black/80 mt-0.5 truncate">
                                    {showSectionNames && (
                                        <span>
                                            {item.section.name}
                                        </span>
                                    )}
                                     {showClassroom && item.time.classroom && (
                                        <span className="font-bold ml-1">
                                             ({item.time.classroom})
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-end mt-1 flex-shrink-0">
                                <span className="font-code font-bold text-lg text-black/80">{item.time.startTime}</span>
                                <span className="font-code font-bold text-lg text-black/80">{item.time.endTime}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

interface ScheduleViewProps {
  courses: Course[];
  schedule: Schedule | null;
  showSectionNames: boolean;
  showClassTypes: boolean;
  showClassroom: boolean;
}

export const ScheduleView = forwardRef<{
    scheduleGrid: HTMLDivElement | null;
    summary: HTMLDivElement | null;
  }, ScheduleViewProps>(({ courses, schedule, showSectionNames, showClassTypes, showClassroom }, ref) => {
  const scheduleGridRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scheduleGrid: scheduleGridRef.current,
    summary: summaryRef.current,
  }));
  
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
        return { startHour: 8, endHour: 18 };
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
    <div className="mt-8" ref={summaryRef}>
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
                  <p className="text-sm text-muted-foreground">
                    {section.name}
                  </p>
                  <div className="text-xs mt-2 space-y-1 text-muted-foreground">
                      <p><b>Lecture:</b> {section.lecture.days.join(', ')} {section.lecture.startTime}-{section.lecture.endTime} {section.lecture.classroom && `(${section.lecture.classroom})`}</p>
                      {section.lab && <p><b>Lab:</b> {section.lab.days.join(', ')} {section.lab.startTime}-{section.lab.endTime} {section.lab.classroom && `(${section.lab.classroom})`}</p>}
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
        <CardContent className="p-0" ref={scheduleGridRef}>
            <div className="overflow-x-auto">
                <HorizontalLayout scheduledItems={scheduledItems} startHour={startHour} endHour={endHour} showSectionNames={showSectionNames} showClassTypes={showClassTypes} showClassroom={showClassroom} />
            </div>
        </CardContent>
      </Card>
      
      {renderSummary()}
    </div>
  );
});

ScheduleView.displayName = 'ScheduleView';
