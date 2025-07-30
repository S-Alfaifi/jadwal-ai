'use server';
/**
 * @fileOverview An AI flow to help users resolve course schedule conflicts.
 *
 * - suggestWorkarounds - A function that provides actionable suggestions for schedule conflicts.
 * - SuggestWorkaroundsInput - The input type for the suggestWorkarounds function.
 * - SuggestWorkaroundsOutput - The return type for the suggestWorkarounds function.
 */

import { ai } from '@/ai/genkit';
import {
  SuggestWorkaroundsInputSchema,
  SuggestWorkaroundsOutputSchema,
  type SuggestWorkaroundsInput,
  type SuggestWorkaroundsOutput,
} from './types';

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

// Re-export types for convenience in other parts of the app
export type { SuggestWorkaroundsInput, SuggestWorkaroundsOutput };
