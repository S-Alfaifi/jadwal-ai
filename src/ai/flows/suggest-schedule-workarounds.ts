'use server';
/**
 * @fileOverview AI-powered schedule workaround suggestions.
 *
 * - suggestScheduleWorkarounds - A function that suggests schedule workarounds based on conflicts.
 * - SuggestScheduleWorkaroundsInput - The input type for the suggestScheduleWorkarounds function.
 * - SuggestScheduleWorkaroundsOutput - The return type for the suggestScheduleWorkarounds function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestScheduleWorkaroundsInputSchema = z.object({
  courses: z.array(
    z.object({
      name: z.string().describe('The name of the course.'),
      sections: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          days: z
            .array(z.enum(['Sun', 'Mon', 'Tue', 'Wed', 'Thu']))
            .describe('The days of the week the section is held.'),
          startTime: z
            .string()
            .describe('The start time of the section (HH:MM).'),
          endTime: z.string().describe('The end time of the section (HH:MM).'),
          type: z.enum(['Lecture', 'Lab']).describe('The type of section.'),
        })
      ),
    })
  ).describe('An array of courses with their respective sections. The AI should determine conflicts between these.'),
});
export type SuggestScheduleWorkaroundsInput = z.infer<
  typeof SuggestScheduleWorkaroundsInputSchema
>;

const SuggestScheduleWorkaroundsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested workarounds to resolve schedule conflicts. Be specific and actionable.'),
});
export type SuggestScheduleWorkaroundsOutput = z.infer<
  typeof SuggestScheduleWorkaroundsOutputSchema
>;

export async function suggestScheduleWorkarounds(
  input: SuggestScheduleWorkaroundsInput
): Promise<SuggestScheduleWorkaroundsOutput> {
  return suggestScheduleWorkaroundsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestScheduleWorkaroundsPrompt',
  input: {schema: SuggestScheduleWorkaroundsInputSchema},
  output: {schema: SuggestScheduleWorkaroundsOutputSchema},
  prompt: `You are an expert university academic advisor. A student is having trouble creating a conflict-free class schedule.

Your task is to analyze the provided list of courses and their section times to identify the core conflicts. Based on your analysis, provide a list of clear, actionable suggestions to help the student build a valid schedule.

Suggestions could include:
- Pointing out the specific courses/sections that overlap.
- Suggesting dropping one of the conflicting courses for a later semester.
- Recommending looking for an alternative section for a specific course if one exists.
- If sections are very close, mentioning that as a potential issue.

Here is the student's desired course list:
{{{JSON.stringify(courses, null, 2)}}}

Please provide helpful workarounds.`,
});

const suggestScheduleWorkaroundsFlow = ai.defineFlow(
  {
    name: 'suggestScheduleWorkaroundsFlow',
    inputSchema: SuggestScheduleWorkaroundsInputSchema,
    outputSchema: SuggestScheduleWorkaroundsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
