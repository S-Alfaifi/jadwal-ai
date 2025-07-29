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
  ).describe('An array of courses with their respective sections.'),
});
export type SuggestScheduleWorkaroundsInput = z.infer<
  typeof SuggestScheduleWorkaroundsInputSchema
>;

const SuggestScheduleWorkaroundsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested workarounds to resolve schedule conflicts.'),
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
  prompt: `You are an AI schedule assistant that will find workarounds for schedule conflicts.

  Given the following course and section information, suggest workarounds to resolve any time conflicts, such as suggesting alternative sections, adjusting times if possible, or re-arranging courses across semesters.

  Courses: {{{JSON.stringify(courses, null, 2)}}}

  Respond with a list of suggestions. Be specific about what course or section the suggestion refers to.`,
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
