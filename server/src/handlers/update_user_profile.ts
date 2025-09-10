import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UpdateUserProfileInput, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUserProfile = async (input: UpdateUserProfileInput): Promise<UserProfile> => {
  try {
    // First, check if the user profile exists
    const existingProfile = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.id))
      .execute();

    if (existingProfile.length === 0) {
      throw new Error(`User profile with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    
    if (input.email !== undefined) updateData['email'] = input.email;
    if (input.username !== undefined) updateData['username'] = input.username;
    if (input.first_name !== undefined) updateData['first_name'] = input.first_name;
    if (input.last_name !== undefined) updateData['last_name'] = input.last_name;
    if (input.bio !== undefined) updateData['bio'] = input.bio;
    if (input.location !== undefined) updateData['location'] = input.location;
    if (input.profile_image_url !== undefined) updateData['profile_image_url'] = input.profile_image_url;
    if (input.github_url !== undefined) updateData['github_url'] = input.github_url;
    if (input.linkedin_url !== undefined) updateData['linkedin_url'] = input.linkedin_url;
    if (input.portfolio_url !== undefined) updateData['portfolio_url'] = input.portfolio_url;
    if (input.twitter_url !== undefined) updateData['twitter_url'] = input.twitter_url;
    if (input.years_of_experience !== undefined) updateData['years_of_experience'] = input.years_of_experience;
    if (input.looking_for !== undefined) updateData['looking_for'] = input.looking_for;
    if (input.availability !== undefined) updateData['availability'] = input.availability;
    if (input.profile_status !== undefined) updateData['profile_status'] = input.profile_status;

    // Always update the updated_at timestamp
    updateData['updated_at'] = new Date();

    // Perform the update
    const result = await db.update(userProfilesTable)
      .set(updateData)
      .where(eq(userProfilesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User profile update failed:', error);
    throw error;
  }
};