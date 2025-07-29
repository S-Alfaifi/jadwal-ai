import type { Course, SectionTime, Schedule, Day, Section } from './types';

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

function getSectionsFromSchedule(courses: Course[], schedule: Schedule): Section[] {
    const sections: Section[] = [];
    for(const courseId in schedule) {
        const course = courses.find(c => c.id === courseId);
        if(!course) continue;

        const section = course.sections.find(s => s.id === schedule[courseId].sectionId);
        if (section) {
            sections.push(section);
        }
    }
    return sections;
}


export function generateSchedules(courses: Course[], lockedSections: any = {}): Schedule[] {
  const schedules: Schedule[] = [];
  const coursesWithSections = courses.filter(c => c.sections.length > 0);

  function findSchedules(courseIndex: number, currentSchedule: Schedule) {
    if (courseIndex === coursesWithSections.length) {
      schedules.push({ ...currentSchedule });
      return;
    }

    const course = coursesWithSections[courseIndex];
    const availableSections = course.sections;

    for (const section of availableSections) {
      const scheduleWithNewSection: Schedule = {
        ...currentSchedule,
        [course.id]: { sectionId: section.id },
      };

      const scheduledSections = getSectionsFromSchedule(courses, scheduleWithNewSection);
      let hasConflict = false;

      // Check for conflicts
      for (let i = 0; i < scheduledSections.length; i++) {
        for (let j = i + 1; j < scheduledSections.length; j++) {
            const sectionA = scheduledSections[i];
            const sectionB = scheduledSections[j];
            
            // Check lecture vs lecture
            if (doSectionsConflict(sectionA.lecture, sectionB.lecture)) {
                hasConflict = true;
                break;
            }
            // Check lecture vs lab
            if(sectionA.lab && doSectionsConflict(sectionA.lab, sectionB.lecture)) {
                hasConflict = true;
                break;
            }
            if(sectionB.lab && doSectionsConflict(sectionA.lecture, sectionB.lab)) {
                hasConflict = true;
                break;
            }
            // Check lab vs lab
            if(sectionA.lab && sectionB.lab && doSectionsConflict(sectionA.lab, sectionB.lab)) {
                hasConflict = true;
                break;
            }
        }
        if(hasConflict) break;
      }
      
      // Also check conflict within the section itself (lecture vs lab)
      if(section.lab && doSectionsConflict(section.lecture, section.lab)) {
        hasConflict = true;
      }


      if (!hasConflict) {
        findSchedules(courseIndex + 1, scheduleWithNewSection);
      }
    }
  }

  findSchedules(0, {});
  return schedules;
}
