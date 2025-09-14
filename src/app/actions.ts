'use server';

import {
  getPersonalizedAnnouncements as getPersonalizedAnnouncementsFlow,
  type PersonalizedAnnouncementsInput,
} from '@/ai/flows/personalized-announcements';

export async function getPersonalizedAnnouncements(
  input: PersonalizedAnnouncementsInput
) {
  const result = await getPersonalizedAnnouncementsFlow(input);
  return result;
}
