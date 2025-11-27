
import type { Course, Schedule, Section, GenerationResult, Conflict, ClassTime, Day } from './types';

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// An internal representation used by the scheduler
interface FlatClassTime {
    day: Day;
    startTime: string;
    endTime: string;
}

function doTimesConflict(time1: FlatClassTime, time2: FlatClassTime): boolean {
  if (time1.day !== time2.day) return false;

  const start1 = timeToMinutes(time1.startTime);
  const end1 = timeToMinutes(time1.endTime);
  const start2 = timeToMinutes(time2.startTime);
  const end2 = timeToMinutes(time2.endTime);

  return start1 < end2 && start2 < end1;
}

function unrollClassTimes(classTime: ClassTime): FlatClassTime[] {
    return classTime.days.map(day => ({
        day: day,
        startTime: classTime.startTime,
        endTime: classTime.endTime,
    }));
}

function getScheduleConflicts(schedule: { course: Course; section: Section }[]): Conflict[] {
    const conflicts: Conflict[] = [];
    const allClassTimes: { course: Course, section: Section, time: FlatClassTime }[] = [];

    schedule.forEach(({ course, section }) => {
        if (section.lecture) {
            section.lecture.times.flatMap(unrollClassTimes).forEach(time => allClassTimes.push({ course, section, time }));
        }
        if (section.lab) {
            section.lab.times.flatMap(unrollClassTimes).forEach(time => allClassTimes.push({ course, section, time }));
        }
    });

    // Check for time conflicts between all individual class times
    for (let i = 0; i < allClassTimes.length; i++) {
        for (let j = i + 1; j < allClassTimes.length; j++) {
            const entry1 = allClassTimes[i];
            const entry2 = allClassTimes[j];

            if (entry1.course.id === entry2.course.id && entry1.section.id === entry2.section.id) continue;

            if (doTimesConflict(entry1.time, entry2.time)) {
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
        if(entry.section.lecture && entry.section.lab) {
            const lectureTimes = entry.section.lecture.times.flatMap(unrollClassTimes);
            const labTimes = entry.section.lab.times.flatMap(unrollClassTimes);
            for (const lecTime of lectureTimes) {
                for (const labTime of labTimes) {
                     if (doTimesConflict(lecTime, labTime)) {
                        conflicts.push({ 
                            type: 'time', 
                            courses: [entry.course],
                            message: `${entry.course.name} (${entry.section.name}) has an internal conflict between its lecture and lab.`
                        });
                    }
                }
            }
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
  
  const uniqueConflicts = conflicts.filter((conflict, index, self) =>
    index === self.findIndex(c => 
        c.message === conflict.message && 
        c.type === conflict.type &&
        c.courses.map(co => co.id).sort().join(',') === conflict.courses.map(co => co.id).sort().join(',')
    )
  );

  return uniqueConflicts;
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

    const allTimes: ClassTime[] = [];
    if (section.lecture) allTimes.push(...section.lecture.times);
    if (section.lab) allTimes.push(...section.lab.times);

    for (const event of allTimes) {
        const flatTimes = unrollClassTimes(event);
        for(const flatTime of flatTimes){
             if (!dailyEvents[flatTime.day]) dailyEvents[flatTime.day] = [];
            dailyEvents[flatTime.day].push({ start: timeToMinutes(flatTime.startTime), end: timeToMinutes(flatTime.endTime) });
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
    const conflicts = findScheduleConflicts(currentSchedule, allCourses);
    if (conflicts.some(c => c.type === 'exam')) {
        return [];
    }
    return [currentSchedule];
  }

  const [currentCourse, ...remainingCourses] = coursesToSchedule;
  let foundSchedules: Schedule[] = [];

  for (const section of currentCourse.sections) {
    const newSchedule = { ...currentSchedule, [currentCourse.id]: { sectionId: section.id } };
    
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

    