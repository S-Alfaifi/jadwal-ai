import type { Course, Schedule, SectionTime } from './types';

// --- Time Conversion & Conflict Detection ---

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function doTimesConflict(
  time1: SectionTime,
  time2: SectionTime
): boolean {
  const commonDays = time1.days.some(day => time2.days.includes(day));
  if (!commonDays) {
    return false;
  }

  const start1 = timeToMinutes(time1.startTime);
  const end1 = timeToMinutes(time1.endTime);
  const start2 = timeToMinutes(time2.startTime);
  const end2 = timeToMinutes(time2.endTime);

  return start1 < end2 && start2 < end1; // Check for overlap
}

function isScheduleConflictFree(schedule: { course: Course; sectionId: string }[]): boolean {
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const entry1 = schedule[i];
      const entry2 = schedule[j];
      
      const section1 = entry1.course.sections.find(s => s.id === entry1.sectionId)!;
      const section2 = entry2.course.sections.find(s => s.id === entry2.sectionId)!;

      // Lecture vs Lecture
      if (doTimesConflict(section1.lecture, section2.lecture)) return false;
      // Lecture vs Lab
      if (section1.lab && doTimesConflict(section1.lab, section2.lecture)) return false;
      if (section2.lab && doTimesConflict(section1.lecture, section2.lab)) return false;
      // Lab vs Lab
      if (section1.lab && section2.lab && doTimesConflict(section1.lab, section2.lab)) return false;
    }
  }
  
  // Also check for internal conflicts in each section (lecture vs lab)
  for(const entry of schedule) {
    const section = entry.course.sections.find(s => s.id === entry.sectionId)!;
    if(section.lab && doTimesConflict(section.lecture, section.lab)) return false;
  }

  return true;
}

// --- Schedule Scoring ---

function calculateGapScore(schedule: { course: Course; sectionId: string }[]): number {
  let totalGaps = 0;
  const dailyEvents: { [day: string]: { start: number; end: number }[] } = {};

  // Collect all events (lectures and labs)
  for (const entry of schedule) {
    const section = entry.course.sections.find(s => s.id === entry.sectionId)!;
    const events = [section.lecture];
    if (section.lab) events.push(section.lab);

    for (const event of events) {
      for (const day of event.days) {
        if (!dailyEvents[day]) {
          dailyEvents[day] = [];
        }
        dailyEvents[day].push({
          start: timeToMinutes(event.startTime),
          end: timeToMinutes(event.endTime),
        });
      }
    }
  }

  // Calculate gaps for each day
  for (const day in dailyEvents) {
    const events = dailyEvents[day].sort((a, b) => a.start - b.start);
    for (let i = 0; i < events.length - 1; i++) {
      const gap = events[i + 1].start - events[i].end;
      if (gap > 0) {
        totalGaps += gap;
      }
    }
  }

  return totalGaps;
}

// --- Schedule Generation ---

export function generateSchedules(courses: Course[], lockedSections: Record<string, string>): Schedule[] {
  const validSchedules: Schedule[] = [];
  const coursesWithSections = courses.filter(c => c.sections.length > 0);

  function findSchedulesRecursive(
    courseIndex: number,
    currentSelection: { course: Course; sectionId: string }[]
  ) {
    // Base case: If we have processed all courses
    if (courseIndex === coursesWithSections.length) {
      // Once a full valid combination is found, format it and add to results
      const finalSchedule: Schedule = {};
      for (const item of currentSelection) {
        finalSchedule[item.course.id] = { sectionId: item.sectionId };
      }
      validSchedules.push(finalSchedule);
      return;
    }

    const course = coursesWithSections[courseIndex];
    const availableSections = course.sections;

    // Iterate through each section of the current course
    for (const section of availableSections) {
      const newSelection = [...currentSelection, { course, sectionId: section.id }];
      
      // Pruning step: Check for conflicts early
      if (isScheduleConflictFree(newSelection)) {
        findSchedulesRecursive(courseIndex + 1, newSelection);
      }
    }
  }
  
  findSchedulesRecursive(0, []);

  // Score and sort the generated schedules
  const scoredSchedules = validSchedules.map(schedule => {
    const selection = courses.map(course => ({
      course,
      sectionId: schedule[course.id]?.sectionId,
    })).filter(item => item.sectionId);

    return {
      schedule,
      score: calculateGapScore(selection as { course: Course; sectionId: string }[]),
    };
  });

  return scoredSchedules.sort((a, b) => a.score - b.score).map(s => s.schedule);
}
