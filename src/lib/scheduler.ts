
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

function getScheduleConflicts(schedule: { course: Course; section: Section }[]): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Check for time conflicts between different courses
    for (let i = 0; i < schedule.length; i++) {
        for (let j = i + 1; j < schedule.length; j++) {
            const entry1 = schedule[i];
            const entry2 = schedule[j];
            
            let hasConflict = false;
            if (doTimesConflict(entry1.section.lecture, entry2.section.lecture)) hasConflict = true;
            if (entry1.section.lab && doTimesConflict(entry1.section.lab, entry2.section.lecture)) hasConflict = true;
            if (entry2.section.lab && doTimesConflict(entry1.section.lecture, entry2.section.lab)) hasConflict = true;
            if (entry1.section.lab && entry2.section.lab && doTimesConflict(entry1.section.lab, entry2.section.lab)) hasConflict = true;
            
            if (hasConflict) {
                conflicts.push({ 
                    type: 'time', 
                    courses: [entry1.course, entry2.course],
                    message: `${entry1.course.name} and ${entry2.course.name} have a time conflict.`
                });
            }
        }
    }

    // Check for internal (lecture vs lab) time conflicts within the same course section
    for (const entry of schedule) {
        if (entry.section.lab && doTimesConflict(entry.section.lecture, entry.section.lab)) {
            conflicts.push({ 
                type: 'time', 
                courses: [entry.course],
                message: `${entry.course.name} (${entry.section.name}) has an internal conflict between its lecture and lab.`
            });
        }
    }

    // Check for exam conflicts
    const examPeriods = new Map<number, Course[]>();
    for (const entry of schedule) {
        if (entry.course.finalExamPeriod) {
            if (!examPeriods.has(entry.course.finalExamPeriod)) {
                examPeriods.set(entry.course.finalExamPeriod, []);
            }
            examPeriods.get(entry.course.finalExamPeriod)!.push(entry.course);
        }
    }
    
    for (const [period, courses] of examPeriods.entries()) {
        if (courses.length > 1) {
            const courseNames = courses.map(c => c.name);
            conflicts.push({ 
                type: 'exam', 
                courses: courses,
                message: `${courseNames.join(' and ')} share the same final exam period: ${period}.`
            });
        }
    }
  
  return conflicts;
}

function findScheduleConflicts(schedule: Schedule, allCourses: Course[]): Conflict[] {
    const scheduleEntries = Object.entries(schedule).map(([courseId, { sectionId }]) => {
        const course = allCourses.find(c => c.id === courseId);
        const section = course?.sections.find(s => s.id === sectionId);
        return { course, section };
    }).filter((e): e is { course: Course, section: Section } => !!e.course && !!e.section);

    return getScheduleConflicts(scheduleEntries);
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
    // Before returning a valid schedule, double-check for exam conflicts
    const conflicts = findScheduleConflicts(currentSchedule, allCourses);
    if (conflicts.some(c => c.type === 'exam')) {
        return []; // This path has an exam conflict, so it's invalid.
    }
    return [currentSchedule];
  }

  const [currentCourse, ...remainingCourses] = coursesToSchedule;
  let foundSchedules: Schedule[] = [];

  for (const section of currentCourse.sections) {
    const newSchedule = { ...currentSchedule, [currentCourse.id]: { sectionId: section.id } };
    
    // Check only for time conflicts at this stage
    const scheduleEntries = Object.entries(newSchedule).map(([courseId, { sectionId }]) => {
        const course = allCourses.find(c => c.id === courseId);
        const section = course?.sections.find(s => s.id === sectionId);
        return { course, section };
    }).filter((e): e is { course: Course, section: Section } => !!e.course && !!e.section);

    const timeConflicts = getScheduleConflicts(scheduleEntries).filter(c => c.type === 'time');

    if (timeConflicts.length === 0) {
      foundSchedules = foundSchedules.concat(
        findSchedulesRecursive(remainingCourses, newSchedule, allCourses)
      );
    }
  }

  return foundSchedules;
}


export function generateSchedules(allCourses: Course[]): GenerationResult {
    let schedules = findSchedulesRecursive(allCourses, {}, allCourses);
    const allConflicts = findScheduleConflicts(
      allCourses.reduce((acc, course) => {
          if (course.sections.length > 0) acc[course.id] = { sectionId: course.sections[0].id };
          return acc;
      }, {} as Schedule), 
      allCourses
    );

    if (schedules.length > 0) {
        const scoredSchedules = schedules.map(schedule => ({
          schedule,
          score: calculateGapScore(schedule, allCourses)
        })).sort((a,b) => a.score - b.score);

        const uniqueSchedules = [...new Set(scoredSchedules.map(s => JSON.stringify(s.schedule)))].slice(0, 20).map(s => JSON.parse(s));
        
        const examConflictsInFirstSchedule = findScheduleConflicts(uniqueSchedules[0], allCourses).filter(c => c.type === 'exam');

        return {
            schedules: uniqueSchedules,
            conflicts: examConflictsInFirstSchedule,
            excludedCourses: [],
        };
    }

    // If no complete schedule, try generating partial schedules by removing one course at a time
    let allPartialSchedules: Schedule[] = [];
    let allExcludedCourses: Course[] = [];

    for (let i = 0; i < allCourses.length; i++) {
        const coursesToTry = [...allCourses];
        const excludedCourse = coursesToTry.splice(i, 1)[0];
        
        const partialSchedules = findSchedulesRecursive(coursesToTry, {}, allCourses);

        if (partialSchedules.length > 0) {
            allPartialSchedules.push(...partialSchedules);
            allExcludedCourses.push(excludedCourse);
        }
    }
    
    if (allPartialSchedules.length > 0) {
        const scoredSchedules = allPartialSchedules.map(schedule => ({
            schedule,
            score: calculateGapScore(schedule, allCourses)
        })).sort((a, b) => a.score - b.score);

        const uniqueSchedules = [...new Set(scoredSchedules.map(s => JSON.stringify(s.schedule)))].slice(0, 20).map(s => JSON.parse(s));
        
        const firstScheduleCourseIds = Object.keys(uniqueSchedules[0]);
        const firstExcludedCourse = allCourses.find(c => !firstScheduleCourseIds.includes(c.id));
        let conflictToShow = allConflicts.find(conflict => conflict.courses.some(c => c.id === firstExcludedCourse?.id));

        return {
            schedules: uniqueSchedules,
            conflicts: conflictToShow ? [conflictToShow] : [],
            excludedCourses: firstExcludedCourse ? [firstExcludedCourse] : [],
        };
    }

    return {
        schedules: [],
        conflicts: allConflicts.slice(0,1),
        excludedCourses: allCourses,
    };
}
