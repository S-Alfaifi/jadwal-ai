import type { Course, SectionTime, Schedule, Day } from './types';

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function doSectionsConflict(section1: SectionTime, section2: SectionTime): boolean {
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

// This function needs a complete overhaul as the data structure is different.
// The core logic of backtracking remains, but we are not iterating through sections anymore.
// For now, we'll assume each course has one lecture and one optional lab, so there's nothing to "schedule" or "select".
// We just need to check for conflicts. A "valid" schedule is just the single combination of all defined lectures/labs.

function getSectionsForSchedule(courses: Course[], schedule: Schedule): SectionTime[] {
    const sections: SectionTime[] = [];
    for(const courseId in schedule) {
        const course = courses.find(c => c.id === courseId);
        if(!course) continue;

        if (course.lecture.id === schedule[courseId].lecture) {
            sections.push(course.lecture);
        }
        if (course.lab && course.lab.id === schedule[courseId].lab) {
            sections.push(course.lab);
        }
    }
    return sections;
}


// A simplified generator that returns one schedule if no conflicts exist.
export function generateSchedules(courses: Course[], lockedSections: any = {}): Schedule[] {
  const allSections: {courseId: string, section: SectionTime, type: 'lecture' | 'lab'}[] = [];
  
  courses.forEach(course => {
    allSections.push({courseId: course.id, section: course.lecture, type: 'lecture'});
    if(course.lab) {
        allSections.push({courseId: course.id, section: course.lab, type: 'lab'});
    }
  });

  for (let i = 0; i < allSections.length; i++) {
    for (let j = i + 1; j < allSections.length; j++) {
      if (doSectionsConflict(allSections[i].section, allSections[j].section)) {
        // If there is any conflict, we cannot generate a schedule with the current model.
        return [];
      }
    }
  }

  // If no conflicts, construct the single valid schedule.
  const schedule: Schedule = {};
  courses.forEach(course => {
    schedule[course.id] = {
      lecture: course.lecture.id,
      lab: course.lab?.id,
    }
  });

  return [schedule];
}
