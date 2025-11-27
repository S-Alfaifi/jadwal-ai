
"use client";

import React, { useMemo, forwardRef, useRef, useImperativeHandle } from 'react';
import type { Course, Schedule, Section, Day, ClassTime } from '@/lib/types';
import { ALL_DAYS } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookText, FlaskConical } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

interface PositionedEvent {
  course: Course;
  section: Section;
  type: 'Lecture' | 'Lab';
  time: ClassTime;
  day: Day;
  startTime: string;
  endTime: string;
  classroom?: string;
  startMinutes: number;
  endMinutes: number;
  track: number;
}

const HorizontalLayout = ({ scheduledItems, startHour, endHour, showSectionNames, showClassTypes, showClassroom }: { scheduledItems: { course: Course; section: Section; }[], startHour: number, endHour: number, showSectionNames: boolean, showClassTypes: boolean, showClassroom: boolean }) => {
    const { language } = useLanguage();
    const t = translations[language];

    const getDayName = (day: Day) => {
        return t.addCourseForm.days?.[day] ?? day;
    }
    const visualTimeSlots = Array.from({ length: (endHour - startHour) * 2 }, (_, i) => {
        const hour = startHour + Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${String(hour).padStart(2, '0')}:${minute}`;
    });

    const layoutInterval = 5; // minutes
    const columnsPerHour = 60 / layoutInterval;
    const totalColumns = (endHour - startHour) * columnsPerHour;

    const { positionedEvents, dayTrackCounts } = useMemo(() => {
        const allEvents: Omit<PositionedEvent, 'track'>[] = [];
        scheduledItems.forEach(({ course, section }) => {
            const processTime = (type: 'Lecture' | 'Lab', classSectionTime: { times: ClassTime[] } | undefined) => {
                if (!classSectionTime || !classSectionTime.times) return;
                classSectionTime.times.forEach(time => {
                    if (!time || !time.days) return;
                    time.days.forEach(day => {
                        allEvents.push({
                            course, section, type, time, day,
                            startTime: time.startTime,
                            endTime: time.endTime,
                            classroom: time.classroom,
                            startMinutes: timeToMinutes(time.startTime),
                            endMinutes: timeToMinutes(time.endTime),
                        });
                    })
                });
            };
            if(section.lecture) processTime('Lecture', section.lecture);
            if(section.lab) processTime('Lab', section.lab);
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
            <div className="sticky left-0 top-0 z-30 flex items-center justify-center bg-background border-r border-b">
                <div className={cn('text-xs font-medium text-muted-foreground p-2', language === 'ar' ? 'font-arabic' : '')}>{t.scheduleView.time}</div>
            </div>
            
            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${visualTimeSlots.length}, minmax(4.5rem, 1fr))`}}>
                 {visualTimeSlots.map((time) => (
                    <div key={time} className="text-center p-2 text-[10px] md:text-xs font-medium text-muted-foreground border-r border-b" >
                        {time.endsWith('00') ? time : ''}
                    </div>
                ))}
            </div>
            
            <div className="sticky left-0 z-20 flex flex-col">
                {ALL_DAYS.map((day) => (
                    <div key={day} className={cn('flex-grow flex items-center justify-center p-2 font-bold text-foreground bg-background border-b border-r', language === 'ar' ? 'font-arabic' : '')} style={{minHeight: `${dayTrackCounts[day] * 80}px`}}>
                       {getDayName(day)}
                    </div>
                ))}
            </div>

            <div className="relative grid" style={{ gridTemplateColumns: `repeat(${totalColumns}, 1fr)`, gridTemplateRows: `repeat(${Object.values(dayTrackCounts).reduce((a,b) => a+b, 0)}, 80px)`}}>
                {ALL_DAYS.map((day, dayIndex) => {
                    const dayRowStart = ALL_DAYS.slice(0, dayIndex).reduce((acc, d) => acc + dayTrackCounts[d], 0) + 1;
                    return Array.from({length: dayTrackCounts[day]}).map((_, trackIndex) => (
                        Array.from({length: visualTimeSlots.length}).map((_, timeIndex) => (
                            <div key={`${day}-${trackIndex}-${timeIndex}`} className="border-r border-b" style={{
                                gridRow: dayRowStart + trackIndex,
                                gridColumn: `${(timeIndex * columnsPerHour / 2) + 1} / span ${columnsPerHour / 2}`,
                                minHeight: '80px',
                            }}/>
                        ))
                    ))
                 })}

                {positionedEvents.map((item, eventIndex) => {
                    const startCol = Math.floor((item.startMinutes - startHour * 60) / layoutInterval) + 1;
                    const endCol = Math.ceil((item.endMinutes - startHour * 60) / layoutInterval) + 1;

                    const dayRowStart = ALL_DAYS.slice(0, ALL_DAYS.indexOf(item.day)).reduce((acc, d) => acc + dayTrackCounts[d], 0) + 1;
                    const rowStart = dayRowStart + item.track;
                    
                    return (
                        <div
                            key={`${item.course.id}-${item.section.id}-${item.day}-${item.type}-${eventIndex}`}
                            className="rounded-lg p-2 flex flex-col relative text-black m-1"
                            style={{
                                gridRow: `${rowStart} / span 1`,
                                gridColumn: `${startCol} / ${endCol}`,
                                backgroundColor: item.course.color,
                                zIndex: 10,
                                minHeight: '72px'
                            }}>
                            <div>
                                <p className={cn('font-bold text-sm text-black/90 truncate', language === 'ar' ? 'font-arabic text-base' : '')} title={item.course.name}>{item.course.name}</p>
                                <div className={cn('text-xs text-black/80 flex items-center gap-x-2 mt-0.5', language === 'ar' ? 'font-arabic text-sm' : '')}>
                                    {showClassTypes && (
                                        <div className="flex items-center gap-1 font-code flex-shrink-0">
                                            {item.type === 'Lecture' 
                                                ? <BookText className="h-4 w-4" /> 
                                                : <FlaskConical className="h-4 w-4" />
                                            }
                                            <span>{t.courseCard.classTypes[item.type]}</span>
                                        </div>
                                    )}
                                    {showSectionNames && (
                                        <span className="truncate">{item.section.name}</span>
                                    )}
                                    {showClassroom && item.classroom && (
                                        <span className="font-bold truncate text-sm">({item.classroom})</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex-grow"></div>
                            <div className="flex justify-between items-end">
                                <span className={cn('font-code font-bold text-xs text-black/80', language === 'ar' && 'text-sm')}>{item.startTime}</span>
                                <span className={cn('font-code font-bold text-xs text-black/80', language === 'ar' && 'text-sm')}>{item.endTime}</span>
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

const renderSummary = (
    summaryRef: React.RefObject<HTMLDivElement>, 
    scheduledItems: { course: Course; section: Section; }[], 
    language: 'en' | 'ar', 
    t: any
) => {
    const formatTimeSlots = (times: ClassTime[] | undefined) => {
      if (!times) return '';
      return times.map(time => {
        if (!time || !time.days) return '';
        return `${time.days.map(d => t.addCourseForm.days?.[d] ?? d).join(', ')} ${time.startTime}-${time.endTime} ${time.classroom ? `(${time.classroom})` : ''}`
      }).join(' | ');
    };

    return (
      <div className="mt-8" ref={summaryRef}>
        <Card>
            <CardHeader>
              <CardTitle className={language === 'ar' ? 'font-arabic' : ''}>{t.scheduleView.summary.title}</CardTitle>
              <CardDescription className={language === 'ar' ? 'font-arabic' : ''}>{t.scheduleView.summary.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduledItems.map(({ course, section }) => (
                <Card key={`${course.id}-${section.id}`} className="flex items-start gap-4 p-4">
                   <div className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: course.color }} />
                  <div className="min-w-0">
                    <h4 className={cn('font-bold break-words', language === 'ar' ? 'font-arabic' : '')}>{course.name}</h4>
                    <p className={cn('text-sm text-muted-foreground', language === 'ar' ? 'font-arabic' : '')}>
                      {section.name}
                    </p>
                    <div className={cn('text-xs mt-2 space-y-1 text-muted-foreground', language === 'ar' ? 'font-arabic' : '')}>
                        {section.lecture && section.lecture.times && section.lecture.times.length > 0 && <p><b>{t.scheduleView.summary.lecture}:</b> {formatTimeSlots(section.lecture.times)}</p>}
                        {section.lab && section.lab.times && section.lab.times.length > 0 && <p><b>{t.scheduleView.summary.lab}:</b> {formatTimeSlots(section.lab.times)}</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
        </Card>
      </div>
    );
  };


export const ScheduleView = forwardRef<{
    scheduleGrid: HTMLDivElement | null;
    summary: HTMLDivElement | null;
  }, ScheduleViewProps>(({ courses, schedule, showSectionNames, showClassTypes, showClassroom }, ref) => {
  const scheduleGridRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const t = translations[language];

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
        const allTimes: ClassTime[] = [];
        if (section?.lecture?.times) allTimes.push(...section.lecture.times);
        if (section?.lab?.times) allTimes.push(...section.lab.times);

        allTimes.forEach(time => {
            if (!time || !time.startTime || !time.endTime) return;
            const start = timeToMinutes(time.startTime);
            const end = timeToMinutes(time.endTime);
            if(start < minMinute) minMinute = start;
            if(end > maxMinute) maxMinute = end;
        })
    });
    
    const startH = Math.floor(minMinute/60);
    const endH = Math.ceil(maxMinute/60);

    return {startHour: startH < 24 ? startH : 8, endHour: endH > 0 ? Math.max(endH, startH + 1) : 18};
  }, [scheduledItems]);

  return (
    <div className="mt-8">
      <Card>
        <CardContent className="p-0" ref={scheduleGridRef}>
            <div className="overflow-x-auto">
                <HorizontalLayout scheduledItems={scheduledItems} startHour={startHour} endHour={endHour} showSectionNames={showSectionNames} showClassTypes={showClassTypes} showClassroom={showClassroom} />
            </div>
        </CardContent>
      </Card>
      
      {renderSummary(summaryRef, scheduledItems, language, t)}
    </div>
  );
});

ScheduleView.displayName = 'ScheduleView';
