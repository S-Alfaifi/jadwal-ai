
"use client";

import React, { useMemo } from 'react';
import type { Course, Schedule, Section, Day, SectionTime } from '@/lib/types';
import { ALL_DAYS } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <div className="grid grid-cols-[auto_1fr] bg-background font-sans">
            <div className="sticky left-0 top-0 z-30 flex items-center justify-center bg-card border-r p-2">
                <div className="text-xs font-medium text-muted-foreground">Time</div>
            </div>
            
            <div className="relative grid border-b" style={{ gridTemplateColumns: `repeat(${timeSlots.length}, minmax(6rem, 1fr))`}}>
                 {timeSlots.map((time) => (
                    <div key={time} className="text-center p-2 text-xs font-medium text-muted-foreground border-r" >
                        {time.endsWith('00') ? time : ''}
                    </div>
                ))}
            </div>

            <div className="sticky left-0 z-20 flex flex-col">
                {ALL_DAYS.map((day) => (
                    <div key={day} className="flex-grow flex items-center justify-center p-2 font-bold text-primary-foreground bg-card border-b border-r" style={{minHeight: `${dayTrackCounts[day] * 80}px`}}>
                       {day}
                    </div>
                ))}
            </div>

            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${timeSlots.length}, minmax(6rem, 1fr))`}}>
                {ALL_DAYS.map((day, dayIndex) => (
                    positionedEvents.filter(e => e.day === day).map((item, eventIndex) => {
                        const startCol = ((item.startMinutes - startHour * 60) / 30);
                        const durationCols = (item.endMinutes - item.startMinutes) / 30;
                        
                        const dayRowStart = ALL_DAYS.slice(0, dayIndex).reduce((acc, d) => acc + dayTrackCounts[d], 0) + 1;
                        const rowStart = dayRowStart + item.track;

                        return (
                            <div
                                key={`${item.course.id}-${item.section.id}-${item.day}-${item.type}-${eventIndex}`}
                                className="rounded-lg p-2 flex flex-col justify-center relative overflow-hidden text-black m-1 shadow-md"
                                style={{
                                    gridRow: `${rowStart} / span 1`,
                                    gridColumn: `${startCol + 1} / span ${durationCols}`,
                                    backgroundColor: item.course.color,
                                    zIndex: 10,
                                    minHeight: '72px'
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
                    })
                ))}
                 {ALL_DAYS.map((day, dayIndex) => {
                    const dayRowStart = ALL_DAYS.slice(0, dayIndex).reduce((acc, d) => acc + dayTrackCounts[d], 0) + 1;
                    return Array.from({length: dayTrackCounts[day]}).map((_, trackIndex) => (
                        Array.from({length: timeSlots.length}).map((_, timeIndex) => (
                            <div key={`${day}-${trackIndex}-${timeIndex}`} className="border-r border-b" style={{
                                gridRow: dayRowStart + trackIndex,
                                gridColumn: timeIndex + 1
                            }}/>
                        ))
                    ))
                 })}
            </div>
        </div>
    );
}

interface ScheduleViewProps {
  courses: Course[];
  schedule: Schedule | null;
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
            <div className="grid grid-cols-[auto_1fr] bg-background font-sans">
                {/* Top-left corner */}
                <div className="sticky left-0 top-0 z-30 flex items-center justify-center bg-card border-b border-r p-2">
                    <div className="text-xs font-medium text-muted-foreground">Time</div>
                </div>
                
                {/* Time Header */}
                <div className="relative grid border-b" style={{ gridTemplateColumns: `repeat(${(endHour - startHour) * 2}, minmax(6rem, 1fr))`}}>
                    {Array.from({ length: (endHour - startHour) * 2 }).map((_, i) => {
                        const hour = startHour + Math.floor(i / 2);
                        const minute = i % 2 === 0 ? '00' : '30';
                        const time = `${String(hour).padStart(2, '0')}:${minute}`;
                        return (
                            <div key={time} className="text-center p-2 text-xs font-medium text-muted-foreground border-r" >
                                {time.endsWith('00') ? time : ''}
                            </div>
                        )
                    })}
                </div>

                {/* Day Column */}
                <div className="sticky left-0 z-20 flex flex-col">
                    {ALL_DAYS.map((day) => {
                        const dayEvents = scheduledItems.flatMap(({ course, section }) => {
                            const events: PositionedEvent[] = [];
                            if (section.lecture.days.includes(day)) {
                                events.push({ course, section, type: 'Lecture', time: section.lecture, day, startMinutes: 0, endMinutes: 0, track: 0 });
                            }
                            if (section.lab && section.lab.days.includes(day)) {
                                events.push({ course, section, type: 'Lab', time: section.lab, day, startMinutes: 0, endMinutes: 0, track: 0 });
                            }
                            return events;
                        });

                        const trackCount = useMemo(() => {
                           if (dayEvents.length === 0) return 1;
                           const dayTracks: PositionedEvent[][] = [];
                           const sortedEvents = dayEvents
                                .map(e => ({...e, startMinutes: timeToMinutes(e.time.startTime), endMinutes: timeToMinutes(e.time.endTime)}))
                                .sort((a,b) => a.startMinutes - b.startMinutes);

                            sortedEvents.forEach(event => {
                                let placed = false;
                                for (let i = 0; i < dayTracks.length; i++) {
                                    if (!dayTracks[i].some(p => event.startMinutes < p.endMinutes && event.endMinutes > p.startMinutes)) {
                                        dayTracks[i].push(event as PositionedEvent);
                                        placed = true;
                                        break;
                                    }
                                }
                                if (!placed) {
                                    dayTracks.push([event as PositionedEvent]);
                                }
                            });
                           return dayTracks.length;
                        }, [dayEvents]);

                        return (
                           <div key={day} className="flex-grow flex items-center justify-center p-2 font-bold text-primary-foreground bg-card border-b border-r" style={{minHeight: `${trackCount * 80}px`}}>
                               {day}
                           </div>
                        );
                    })}
                </div>

                {/* Schedule Grid */}
                <div className="relative grid" style={{ gridTemplateColumns: `repeat(${(endHour - startHour) * 2}, minmax(6rem, 1fr))`}}>
                   {/* Events */}
                   {useMemo(() => {
                       const positionedEvents: PositionedEvent[] = [];
                       const dayTracks: Record<string, PositionedEvent[][]> = {};
                       ALL_DAYS.forEach(d => dayTracks[d] = []);

                       const allEvents = scheduledItems.flatMap(({ course, section }) => 
                           [section.lecture, section.lab].filter(Boolean).flatMap(time => 
                               time!.days.map(day => ({ course, section, time: time!, day, type: time === section.lecture ? 'Lecture' : 'Lab' }))
                           )
                       ).sort((a,b) => timeToMinutes(a.time.startTime) - timeToMinutes(b.time.startTime));

                       allEvents.forEach(event => {
                           let placed = false;
                           const startMinutes = timeToMinutes(event.time.startTime);
                           const endMinutes = timeToMinutes(event.time.endTime);
                           for (let i = 0; i < dayTracks[event.day].length; i++) {
                               if (!dayTracks[event.day][i].some(p => startMinutes < p.endMinutes && endMinutes > p.startMinutes)) {
                                   const positionedEvent = { ...event, startMinutes, endMinutes, track: i };
                                   dayTracks[event.day][i].push(positionedEvent);
                                   positionedEvents.push(positionedEvent);
                                   placed = true;
                                   break;
                               }
                           }
                           if (!placed) {
                               const track = dayTracks[event.day].length;
                               const positionedEvent = { ...event, startMinutes, endMinutes, track };
                               dayTracks[event.day].push([positionedEvent]);
                               positionedEvents.push(positionedEvent);
                           }
                       });
                       
                       const dayRowStarts: Record<string, number> = {};
                       let cumulativeRows = 1;
                       ALL_DAYS.forEach(day => {
                           dayRowStarts[day] = cumulativeRows;
                           cumulativeRows += dayTracks[day].length || 1;
                       });

                       return positionedEvents.map((item, index) => {
                           const startCol = ((item.startMinutes - startHour * 60) / 30);
                           const durationCols = (item.endMinutes - item.startMinutes) / 30;

                           return (
                               <div
                                   key={`${item.course.id}-${item.section.id}-${item.day}-${item.type}-${index}`}
                                   className="rounded-lg p-2 flex flex-col justify-center relative overflow-hidden text-black m-1 shadow-md"
                                   style={{
                                       gridRow: `${dayRowStarts[item.day] + item.track} / span 1`,
                                       gridColumn: `${startCol + 1} / span ${durationCols}`,
                                       backgroundColor: item.course.color,
                                       zIndex: 10,
                                       minHeight: '72px'
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
                       })
                   }, [scheduledItems, startHour, endHour])}

                   {/* Grid Lines */}
                   {useMemo(() => {
                        const rows: JSX.Element[] = [];
                        let totalRows = 0;

                         ALL_DAYS.forEach(day => {
                            const dayEvents = scheduledItems.flatMap(({ course, section }) => {
                                const events: any[] = [];
                                if (section.lecture.days.includes(day)) events.push({ ...section.lecture });
                                if (section.lab && section.lab.days.includes(day)) events.push({ ...section.lab });
                                return events;
                            });
                             const dayTracks: any[][] = [];
                             const sortedEvents = dayEvents
                                .map(e => ({...e, startMinutes: timeToMinutes(e.startTime), endMinutes: timeToMinutes(e.endTime)}))
                                .sort((a,b) => a.startMinutes - b.startMinutes);

                             sortedEvents.forEach(event => {
                                 let placed = false;
                                 for (let i = 0; i < dayTracks.length; i++) {
                                     if (!dayTracks[i].some(p => event.startMinutes < p.endMinutes && event.endMinutes > p.startMinutes)) {
                                         dayTracks[i].push(event);
                                         placed = true;
                                         break;
                                     }
                                 }
                                 if (!placed) dayTracks.push([event]);
                             });
                            totalRows += dayTracks.length || 1;
                        });
                        
                        for (let row = 1; row <= totalRows; row++) {
                            for (let col = 1; col <= (endHour - startHour) * 2; col++) {
                                rows.push(<div key={`${row}-${col}`} className="border-r border-b" style={{gridRow: row, gridColumn: col}} />);
                            }
                        }
                        return rows;
                   }, [scheduledItems, startHour, endHour])}
                </div>
            </div>
        </CardContent>
      </Card>
      
      {renderSummary()}
    </div>
  );
}
