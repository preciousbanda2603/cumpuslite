'use server';

/**
 * @fileOverview A personalized announcements AI agent.
 *
 * - getPersonalizedAnnouncements - A function that retrieves personalized announcements for a student.
 * - PersonalizedAnnouncementsInput - The input type for the getPersonalizedAnnouncements function.
 * - PersonalizedAnnouncementsOutput - The return type for the getPersonalizedAnnouncements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedAnnouncementsInputSchema = z.object({
  studentInterests: z
    .string()
    .describe('A comma separated list of the student interests.'),
  studentActivities: z
    .string()
    .describe('A comma separated list of the student activities.'),
  allAnnouncements: z.string().describe('A comma separated list of all school announcements.'),
});
export type PersonalizedAnnouncementsInput = z.infer<
  typeof PersonalizedAnnouncementsInputSchema
>;

const PersonalizedAnnouncementsOutputSchema = z.object({
  personalizedAnnouncements: z
    .string()
    .describe('A comma separated list of announcements relevant to the student.'),
});
export type PersonalizedAnnouncementsOutput = z.infer<
  typeof PersonalizedAnnouncementsOutputSchema
>;

export async function getPersonalizedAnnouncements(
  input: PersonalizedAnnouncementsInput
): Promise<PersonalizedAnnouncementsOutput> {
  return personalizedAnnouncementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedAnnouncementsPrompt',
  input: {schema: PersonalizedAnnouncementsInputSchema},
  output: {schema: PersonalizedAnnouncementsOutputSchema},
  prompt: `You are an AI assistant specializing in filtering school announcements for students.

You will receive a list of all school announcements, a list of the student\'s interests, and a list of the student\'s activities.

Based on this information, you will determine which announcements are most relevant to the student.

Return a comma separated list of the announcements that are relevant to the student.

Student Interests: {{{studentInterests}}}
Student Activities: {{{studentActivities}}}
All Announcements: {{{allAnnouncements}}}`,
});

const personalizedAnnouncementsFlow = ai.defineFlow(
  {
    name: 'personalizedAnnouncementsFlow',
    inputSchema: PersonalizedAnnouncementsInputSchema,
    outputSchema: PersonalizedAnnouncementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
