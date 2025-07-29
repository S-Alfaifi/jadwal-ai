export type Day = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu';

export const ALL_DAYS: Day[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'];

export interface SectionTime {
  id: string;
  days: Day[];
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface Course {
  id:string;
  name: string;
  lecture: SectionTime;
  lab?: SectionTime;
  color: string;
}

export interface Schedule {
  [courseId: string]: {
    lecture: string;
    lab?: string;
  }; 
}
