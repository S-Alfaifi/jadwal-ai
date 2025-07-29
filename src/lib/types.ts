export type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu';

export const ALL_DAYS: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

export interface Section {
  id: string;
  days: Day[];
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  type: 'Lecture' | 'Lab';
}

export interface Course {
  id:string;
  name: string;
  sections: Section[];
  color: string;
}

export interface Schedule {
  [courseId: string]: string; // courseId -> sectionId
}
