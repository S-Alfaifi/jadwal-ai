
export type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu';

export const ALL_DAYS: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

export interface ClassTime {
  days: Day[];
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  classroom?: string;
}

export interface SectionTime {
  times: ClassTime[];
}

export interface Section {
  id: string;
  name: string;
  lecture?: SectionTime;
  lab?: SectionTime;
  isEnabled: boolean;
}

export interface Course {
  id: string;
  name: string;
  finalExamPeriod?: number;
  sections: Section[];
  color: string;
  isEnabled: boolean;
}

export interface Schedule {
  [courseId: string]: {
    sectionId: string;
  };
}

export type Conflict = {
    type: 'time' | 'exam';
    courses: Course[];
    message: string;
};

export interface GenerationResult {
    schedules: Schedule[];
    conflicts: Conflict[];
    excludedCourses: Course[];
}

export type Language = 'en' | 'ar';

    