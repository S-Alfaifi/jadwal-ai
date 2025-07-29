
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

  const findCourseName = (id: string) => allCourses.find(c => c.id === id)?.name || id;

  // Check for time conflicts
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const entry1 = schedule[i];
      const entry2 = schedule[j];
      const section1 = entry1.course.sections.find(s => s.id === entry1.sectionId)!;
      const section2 = entry2.course.sections.find(s => s.id === entry2.sectionId)!;
      
      let hasConflict = false;
      if(doTimesConflict(section1.lecture, section2.lecture)) hasConflict = true;
      if (section1.lab && doTimesConflict(section1.lab, section2.lecture)) hasConflict = true;
      if (section2.lab && doTimesConflict(section1.lecture, section2.lab)) hasConflict = true;
      if (section1.lab && section2.lab && doTimesConflict(section1.lab, section2.lab)) hasConflict = true;
      
      if (hasConflict) {
        conflicts.push({ 
            type: 'time', 
            courses: [entry1.course.id, entry2.course.id],
            message: `${findCourseName(entry1.course.id)} and ${findCourseName(entry2.course.id)} have a time conflict.`
        });
      }
    }
  }

  // Check for internal (lecture vs lab) time conflicts
  for (const entry of schedule) {
    const section = entry.course.sections.find(s => s.id === entry.sectionId)!;
    if (section.lab && doTimesConflict(section.lecture, section.lab)) {
       conflicts.push({ 
            type: 'time', 
            courses: [entry.course.id, entry.course.id],
            message: `${findCourseName(entry.course.id)} has an internal conflict between its lecture and lab.`
       });
    }
  }

  // Check for exam conflicts
  const examPeriods = new Map<number, string[]>();
  for (const entry of schedule) {
    if (entry.course.finalExamPeriod) {
      if (!examPeriods.has(entry.course.finalExamPeriod)) {
        examPeriods.set(entry.course.finalExamPeriod, []);
      }
      examPeriods.get(entry.course.finalExamPeriod)!.push(entry.course.id);
    }
  }

  for (const [period, courseIds] of examPeriods.entries()) {
    if (courseIds.length > 1) {
      const courseNames = courseIds.map(id => findCourseName(id));
      conflicts.push({ 
          type: 'exam', 
          courses: courseIds,
          message: `${courseNames.join(', ')} share the same final exam period: ${period}.`
      });
    }
  }
  
  return conflicts;
}


function calculateGapScore(schedule: { course: Course; sectionId: string }[]): number {
  let totalGaps = 0;
  const dailyEvents: { [day: string]: { start: number; end: number }[] } = {};

  for (const entry of schedule) {
    const section = entry.course.sections.find(s => s.id === entry.sectionId)!;
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

function findSchedulesForCourseSet(courses: Course[], allCourses: Course[]): Schedule[] {
  if (courses.length === 0) return [];
  const schedules: Schedule[] = [];

  function findSchedulesRecursive(
    courseIndex: number,
    currentSelection: { course: Course; sectionId: string }[]
  ) {
    if (courseIndex === courses.length) {
      if (getScheduleConflicts(currentSelection, allCourses).length === 0) {
        const finalSchedule: Schedule = {};
        currentSelection.forEach(item => {
          finalSchedule[item.course.id] = { sectionId: item.sectionId };
        });
        schedules.push(finalSchedule);
      }
      return;
    }

    const course = courses[courseIndex];
    for (const section of course.sections) {
      findSchedulesRecursive(courseIndex + 1, [...currentSelection, { course, sectionId: section.id }]);
    }
  }

  findSchedulesRecursive(0, []);
  return schedules;
}


export function generateSchedules(allCourses: Course[]): GenerationResult {
    // Attempt with all courses first
    let bestSchedules = findSchedulesForCourseSet(allCourses, allCourses);

    if (bestSchedules.length > 0) {
        return {
            schedules: bestSchedules,
            conflicts: [],
            excludedCourses: [],
        };
    }

    // If no complete schedule, try removing one course at a time
    for (let i = allCourses.length - 1; i >= 0; i--) {
        const excludedCourse = allCourses[i];
        const remainingCourses = allCourses.filter(c => c.id !== excludedCourse.id);
        
        const partialSchedules = findSchedulesForCourseSet(remainingCourses, allCourses);

        if (partialSchedules.length > 0) {
            // We found a working set. Now, find the reason for exclusion.
            let conflictReason: Conflict[] = [];
            for (const includedCourse of remainingCourses) {
                 const testSet = [includedCourse, excludedCourse];
                 const sectionsToTest = testSet.map(c => ({ course: c, sectionId: c.sections[0].id }));
                 const potentialConflicts = getScheduleConflicts(sectionsToTest, allCourses);
                 if (potentialConflicts.length > 0) {
                     conflictReason = potentialConflicts;
                     break; 
                 }
            }
             if (conflictReason.length === 0) {
                // Fallback if direct pairwise conflict isn't found (more complex multi-course issue)
                const sectionsToTest = allCourses.map(c => ({ course: c, sectionId: c.sections[0].id }));
                conflictReason = getScheduleConflicts(sectionsToTest, allCourses);
            }

            const scoredSchedules = partialSchedules.map(schedule => {
                const selection = Object.keys(schedule).map(courseId => {
                    const course = allCourses.find(c => c.id === courseId)!;
                    return { course, sectionId: schedule[courseId].sectionId };
                });
                return { schedule, score: calculateGapScore(selection) };
            }).sort((a, b) => a.score - b.score);

            const uniqueSchedules = [...new Set(scoredSchedules.map(s => JSON.stringify(s.schedule)))].slice(0, 20).map(s => JSON.parse(s));
            
            return {
                schedules: uniqueSchedules,
                conflicts: conflictReason.slice(0,1),
                excludedCourses: [excludedCourse],
            };
        }
    }
    
    // If no schedule can be generated at all (even with removals)
    const sectionsToTest = allCourses.map(c => ({ course: c, sectionId: c.sections[0].id }));
    const conflicts = getScheduleConflicts(sectionsToTest, allCourses);

    return {
        schedules: [],
        conflicts: conflicts.slice(0,1),
        excludedCourses: allCourses,
    };
}
