'use server';
/**
 * @fileOverview An AI flow to help users resolve course schedule conflicts.
 *
 * - suggestWorkarounds - A function that provides actionable suggestions for schedule conflicts.
 * - SuggestWorkaroundsInput - The input type for the suggestWorkarounds function.
 * - SuggestWorkaroundsOutput - The return type for the suggestWorkarounds function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Course, Day } from '@/lib/types';

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
  conflictType: z
    .enum(['time', 'exam'])
    .describe('The type of conflict.'),
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

export async function suggestWorkarounds(
  input: SuggestWorkaroundsInput
): Promise<SuggestWorkaroundsOutput> {
  return suggestWorkaroundsFlow(input);
}

const suggestWorkaroundsPrompt = ai.definePrompt({
  name: 'suggestWorkaroundsPrompt',
  input: { schema: SuggestWorkaroundsInputSchema },
  output: { schema: SuggestWorkaroundsOutputSchema },
  prompt: `You are a friendly and helpful university academic advisor. A student is trying to build their class schedule but has run into a conflict.

Your task is to analyze the conflicting courses and provide a list of 2-3 clear, simple, and actionable suggestions to help them resolve it.

The conflict is a '{{conflictType}}' conflict.

Here are the details of the conflicting courses:
{{#each conflictingCourses}}
- Course Name: {{this.name}}
  - Sections Available:
  {{#each this.sections}}
    - Section: {{this.name}}
      - Lecture: {{this.lecture.days}} at {{this.lecture.startTime}} - {{this.lecture.endTime}}
      {{#if this.lab}}
      - Lab: {{this.lab.days}} at {{this.lab.startTime}} - {{this.lab.endTime}}
      {{/if}}
  {{/each}}
{{/each}}

Based on this information, provide a few specific suggestions. For example, if it's a time conflict, suggest trying a different section of one of the courses that meets at a non-conflicting time. Be encouraging and supportive. Frame your suggestions as if you are talking directly to the student.`,
});

const suggestWorkaroundsFlow = ai.defineFlow(
  {
    name: 'suggestWorkaroundsFlow',
    inputSchema: SuggestWorkaroundsInputSchema,
    outputSchema: SuggestWorkaroundsOutputSchema,
  },
  async (input) => {
    const { output } = await suggestWorkaroundsPrompt(input);
    return output!;
  }
);
