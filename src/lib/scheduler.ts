
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

function getScheduleConflicts(schedule: { course: Course; sectionId: string }[]): Conflict[] {
  const conflicts: Conflict[] = [];

  // Check for time conflicts
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const entry1 = schedule[i];
      const entry2 = schedule[j];
      const section1 = entry1.course.sections.find(s => s.id === entry1.sectionId)!;
      const section2 = entry2.course.sections.find(s => s.id === entry2.sectionId)!;

      if (doTimesConflict(section1.lecture, section2.lecture) ||
          (section1.lab && doTimesConflict(section1.lab, section2.lecture)) ||
          (section2.lab && doTimesConflict(section1.lecture, section2.lab)) ||
          (section1.lab && section2.lab && doTimesConflict(section1.lab, section2.lab))) {
        conflicts.push({ type: 'time', courses: [entry1.course.id, entry2.course.id] });
      }
    }
  }

  // Check for internal (lecture vs lab) time conflicts
  for (const entry of schedule) {
    const section = entry.course.sections.find(s => s.id === entry.sectionId)!;
    if (section.lab && doTimesConflict(section.lecture, section.lab)) {
      conflicts.push({ type: 'time', courses: [entry.course.id, entry.course.id] });
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
      conflicts.push({ type: 'exam', courses: courseIds });
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

const getCombinations = <T,>(array: T[], size: number): T[][] => {
    const result: T[][] = [];
    function combinationUtil(start: number, chosen: T[]) {
      if (chosen.length === size) {
        result.push([...chosen]);
        return;
      }
      if (start >= array.length) return;
      chosen.push(array[start]);
      combinationUtil(start + 1, chosen);
      chosen.pop();
      combinationUtil(start + 1, chosen);
    }
    combinationUtil(0, []);
    return result;
};


export function generateSchedules(allCourses: Course[]): GenerationResult {
    let bestSchedules: Schedule[] = [];
    let excludedCourses: Course[] = [];

    for (let i = allCourses.length; i >= 1 && bestSchedules.length === 0; i--) {
        const courseCombinations = getCombinations(allCourses, i);

        for (const combo of courseCombinations) {
            const validSchedules: Schedule[] = [];
            
            function findSchedulesRecursive(
                courseIndex: number,
                currentSelection: { course: Course; sectionId: string }[]
            ) {
                if (courseIndex === combo.length) {
                    if (getScheduleConflicts(currentSelection).length === 0) {
                        const finalSchedule: Schedule = {};
                        currentSelection.forEach(item => {
                            finalSchedule[item.course.id] = { sectionId: item.sectionId };
                        });
                        validSchedules.push(finalSchedule);
                    }
                    return;
                }

                const course = combo[courseIndex];
                for (const section of course.sections) {
                    findSchedulesRecursive(courseIndex + 1, [...currentSelection, { course, sectionId: section.id }]);
                }
            }

            findSchedulesRecursive(0, []);
            bestSchedules.push(...validSchedules);
        }

        if (bestSchedules.length > 0) {
            excludedCourses = allCourses.filter(c => !combo.some(included => included.id === c.id));
            break;
        }
    }
    
    const conflicts: Conflict[] = [];
    if (bestSchedules.length === 0 && allCourses.length > 0) {
        // If we still found no schedules, find conflicts in the original set
        const sectionsToTest = allCourses.map(c => ({ course: c, sectionId: c.sections[0].id }));
        conflicts.push(...getScheduleConflicts(sectionsToTest));
    }


    const scoredSchedules = bestSchedules.map(schedule => {
        const selection = Object.keys(schedule).map(courseId => {
            const course = allCourses.find(c => c.id === courseId)!;
            return { course, sectionId: schedule[courseId].sectionId };
        });
        return { schedule, score: calculateGapScore(selection) };
    }).sort((a, b) => a.score - b.score);

    const uniqueSchedules = [...new Set(scoredSchedules.map(s => JSON.stringify(s.schedule)))].map(s => JSON.parse(s));

    return {
        schedules: uniqueSchedules,
        conflicts: conflicts,
        excludedCourses,
    };
}
