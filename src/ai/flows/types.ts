/**
 * @fileOverview Shared types and schemas for AI flows.
 */

import { z } from 'zod';
import type { Day } from '@/lib/types';

// Define schemas that can be shared between client and server components

const SectionTimeSchema = z.object({
  days: z.array(z.custom<Day>()),
  startTime: z.string(),
  endTime: z.string(),
});

const SectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  lecture: SectionTimeSchema,
  lab: SectionTimeSchema.optional(),
  isEnabled: z.boolean(),
});

const CourseSchema = z.object({
  id: z.string(),
  name: z.string(),
  finalExamPeriod: z.number().optional(),
  sections: z.array(SectionSchema),
  color: z.string(),
  isEnabled: z.boolean(),
});

export const SuggestWorkaroundsInputSchema = z.object({
  conflictingCourses: z
    .array(CourseSchema)
    .describe('The list of courses that have a scheduling conflict.'),
  conflictType: z.enum(['time', 'exam']).describe('The type of conflict.'),
});
export type SuggestWorkaroundsInput = z.infer<
  typeof SuggestWorkaroundsInputSchema
>;

export const SuggestWorkaroundsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe(
      'A list of clear, actionable suggestions for the user to resolve the conflict.'
    ),
});
export type SuggestWorkaroundsOutput = z.infer<
  typeof SuggestWorkaroundsOutputSchema
>;
