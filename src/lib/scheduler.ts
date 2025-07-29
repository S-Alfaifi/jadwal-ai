import type { Course, Section, Schedule, Day } from './types';

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function doSectionsConflict(section1: Section, section2: Section): boolean {
  const commonDays = section1.days.some(day => section2.days.includes(day));
  if (!commonDays) {
    return false;
  }

  const start1 = timeToMinutes(section1.startTime);
  const end1 = timeToMinutes(section1.endTime);
  const start2 = timeToMinutes(section2.startTime);
  const end2 = timeToMinutes(section2.endTime);

  // Check for overlap
  return start1 < end2 && start2 < end1;
}

export function generateSchedules(courses: Course[], lockedSections: Schedule = {}): Schedule[] {
  const schedules: Schedule[] = [];
  const courseList = courses.filter(c => !lockedSections[c.id]);

  function findSchedules(courseIndex: number, currentSchedule: Schedule) {
    if (courseIndex === courseList.length) {
      schedules.push({ ...currentSchedule });
      return;
    }

    const course = courseList[courseIndex];
    for (const section of course.sections) {
      let hasConflict = false;
      for (const scheduledCourseId in currentSchedule) {
        const scheduledSectionId = currentSchedule[scheduledCourseId];
        const scheduledCourse = courses.find(c => c.id === scheduledCourseId);
        const scheduledSection = scheduledCourse?.sections.find(s => s.id === scheduledSectionId);
        
        if (scheduledSection && doSectionsConflict(section, scheduledSection)) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        currentSchedule[course.id] = section.id;
        findSchedules(courseIndex + 1, currentSchedule);
        delete currentSchedule[course.id];
      }
    }
  }

  findSchedules(0, { ...lockedSections });
  return schedules;
}
