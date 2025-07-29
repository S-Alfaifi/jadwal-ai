
import type { Course, Schedule, SectionTime, Section, GenerationResult, Conflict } from './types';

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function doTimesConflict(time1: SectionTime, time2: SectionTime): boolean {
  const commonDays = time1.days.some(day => time2.days.includes(day));
  if (!commonDays) return false;

  const start1 = timeToMinutes(time1.startTime);
  const end1 = timeToMinutes(time1.endTime);
  const start2 = timeToMinutes(time2.startTime);
  const end2 = timeToMinutes(time2.endTime);

  return start1 < end2 && start2 < end1;
}

function getScheduleConflicts(schedule: { course: Course; sectionId: string }[], allCourses: Course[]): Conflict[] {
  const conflicts: Conflict[] = [];

  const findCourseAndSection = (courseId: string, sectionId: string): { course: Course; section: Section } | null => {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) return null;
    const section = course.sections.find(s => s.id === sectionId);
    if (!section) return null;
    return { course, section };
  };

  const scheduleEntries = Object.entries(schedule).map(([courseId, { sectionId }]) => 
    findCourseAndSection(courseId, sectionId)
  ).filter(Boolean) as { course: Course; section: Section }[];


  // Check for time conflicts
  for (let i = 0; i < scheduleEntries.length; i++) {
    for (let j = i + 1; j < scheduleEntries.length; j++) {
      const entry1 = scheduleEntries[i];
      const entry2 = scheduleEntries[j];
      
      let hasConflict = false;
      if (doTimesConflict(entry1.section.lecture, entry2.section.lecture)) hasConflict = true;
      if (entry1.section.lab && doTimesConflict(entry1.section.lab, entry2.section.lecture)) hasConflict = true;
      if (entry2.section.lab && doTimesConflict(entry1.section.lecture, entry2.section.lab)) hasConflict = true;
      if (entry1.section.lab && entry2.section.lab && doTimesConflict(entry1.section.lab, entry2.section.lab)) hasConflict = true;
      
      if (hasConflict) {
        conflicts.push({ 
            type: 'time', 
            courses: [entry1.course.id, entry2.course.id],
            message: `${entry1.course.name} and ${entry2.course.name} have a time conflict.`
        });
      }
    }
  }

  // Check for internal (lecture vs lab) time conflicts
  for (const entry of scheduleEntries) {
    if (entry.section.lab && doTimesConflict(entry.section.lecture, entry.section.lab)) {
       conflicts.push({ 
            type: 'time', 
            courses: [entry.course.id, entry.course.id],
            message: `${entry.course.name} has an internal conflict between its lecture and lab.`
       });
    }
  }

  // Check for exam conflicts
  const examPeriods = new Map<number, string[]>();
  for (const entry of scheduleEntries) {
    if (entry.course.finalExamPeriod) {
      if (!examPeriods.has(entry.course.finalExamPeriod)) {
        examPeriods.set(entry.course.finalExamPeriod, []);
      }
      examPeriods.get(entry.course.finalExamPeriod)!.push(entry.course.id);
    }
  }

  for (const [period, courseIds] of examPeriods.entries()) {
    if (courseIds.length > 1) {
      const courseNames = courseIds.map(id => allCourses.find(c => c.id === id)?.name || id);
      conflicts.push({ 
          type: 'exam', 
          courses: courseIds,
          message: `${courseNames.join(' and ')} share the same final exam period: ${period}.`
      });
    }
  }
  
  return conflicts;
}


function calculateGapScore(schedule: Schedule, allCourses: Course[]): number {
  let totalGaps = 0;
  const dailyEvents: { [day: string]: { start: number; end: number }[] } = {};

  for (const courseId in schedule) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) continue;
    const section = course.sections.find(s => s.id === schedule[courseId].sectionId);
    if (!section) continue;

    const events = [section.lecture];
    if (section.lab) events.push(section.lab);

    for (const event of events) {
      for (const day of event.days) {
        if (!dailyEvents[day]) dailyEvents[day] = [];
        dailyEvents[day].push({ start: timeToMinutes(event.startTime), end: timeToMinutes(event.endTime) });
      }
    }
  }

  for (const day in dailyEvents) {
    const events = dailyEvents[day].sort((a, b) => a.start - b.start);
    for (let i = 0; i < events.length - 1; i++) {
      totalGaps += Math.max(0, events[i + 1].start - events[i].end);
    }
  }

  return totalGaps;
}

function findSchedulesRecursive(
  coursesToSchedule: Course[],
  currentSchedule: Schedule,
  allCourses: Course[]
): Schedule[] {
  if (coursesToSchedule.length === 0) {
    return [currentSchedule];
  }

  const [currentCourse, ...remainingCourses] = coursesToSchedule;
  let foundSchedules: Schedule[] = [];

  for (const section of currentCourse.sections) {
    const newSchedule = { ...currentSchedule, [currentCourse.id]: { sectionId: section.id } };
    
    if (getScheduleConflicts(newSchedule, allCourses).length === 0) {
      foundSchedules = foundSchedules.concat(
        findSchedulesRecursive(remainingCourses, newSchedule, allCourses)
      );
    }
  }

  return foundSchedules;
}


export function generateSchedules(allCourses: Course[]): GenerationResult {
    // Attempt with all courses first
    let schedules = findSchedulesRecursive(allCourses, {}, allCourses);

    if (schedules.length > 0) {
        const scoredSchedules = schedules.map(schedule => ({
          schedule,
          score: calculateGapScore(schedule, allCourses)
        })).sort((a,b) => a.score - b.score);

        const uniqueSchedules = [...new Set(scoredSchedules.map(s => JSON.stringify(s.schedule)))].slice(0, 20).map(s => JSON.parse(s));

        return {
            schedules: uniqueSchedules,
            conflicts: [],
            excludedCourses: [],
        };
    }

    // If no complete schedule, try removing one course at a time
    for (let i = allCourses.length - 1; i >= 0; i--) {
        const coursesToTry = [...allCourses];
        const excludedCourse = coursesToTry.splice(i, 1)[0];
        
        const partialSchedules = findSchedulesRecursive(coursesToTry, {}, allCourses);

        if (partialSchedules.length > 0) {
            // We found a working set. Now, find the specific reason for exclusion.
            let conflictReason: Conflict[] = [];
            for(const testCourse of coursesToTry) {
              // Create a dummy schedule with just the excluded course and one of the included ones
              const testSchedule: Schedule = {
                [excludedCourse.id]: { sectionId: excludedCourse.sections[0].id },
                [testCourse.id]: { sectionId: testCourse.sections[0].id }
              };
              const potentialConflicts = getScheduleConflicts(testSchedule, allCourses);
              if (potentialConflicts.length > 0) {
                // Found a direct conflict that explains the exclusion
                conflictReason = potentialConflicts;
                break;
              }
            }

            if (conflictReason.length === 0) {
               // Fallback if a simple pair-wise conflict isn't the issue (more complex multi-course issue)
               const scheduleWithAll = { ...partialSchedules[0], [excludedCourse.id]: {sectionId: excludedCourse.sections[0].id}};
               conflictReason = getScheduleConflicts(scheduleWithAll, allCourses);
            }

            const scoredSchedules = partialSchedules.map(schedule => ({
                schedule,
                score: calculateGapScore(schedule, allCourses)
            })).sort((a, b) => a.score - b.score);

            const uniqueSchedules = [...new Set(scoredSchedules.map(s => JSON.stringify(s.schedule)))].slice(0, 20).map(s => JSON.parse(s));
            
            return {
                schedules: uniqueSchedules,
                conflicts: conflictReason.slice(0, 1), // Report the first, most direct conflict
                excludedCourses: [excludedCourse],
            };
        }
    }
    
    // If no schedule can be generated at all
    const testSchedule = allCourses.reduce((acc, course) => {
        if (course.sections.length > 0) {
            acc[course.id] = { sectionId: course.sections[0].id };
        }
        return acc;
    }, {} as Schedule);
    const conflicts = getScheduleConflicts(testSchedule, allCourses);

    return {
        schedules: [],
        conflicts: conflicts.slice(0,1),
        excludedCourses: allCourses,
    };
}
