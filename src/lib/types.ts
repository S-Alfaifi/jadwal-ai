export type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu';

export const ALL_DAYS: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

export interface SectionTime {
  days: Day[];
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface Section {
  id: string;
  name: string;
  lecture: SectionTime;
  lab?: SectionTime;
}

export interface Course {
  id: string;
  name: string;
  sections: Section[];
  color: string;
}

export interface Schedule {
  [courseId: string]: {
    sectionId: string;
  };
}
