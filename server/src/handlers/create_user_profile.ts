import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput, type UserProfile } from '../schema';

export const createUserProfile = async (input: CreateUserProfileInput): Promise<UserProfile> => {
  try {
    // Insert user profile record
    const result = await db.insert(userProfilesTable)
      .values({
        email: input.email,
        username: input.username,
        first_name: input.first_name,
        last_name: input.last_name,
        bio: input.bio,
        location: input.location,
        profile_image_url: input.profile_image_url,
        github_url: input.github_url,
        linkedin_url: input.linkedin_url,
        portfolio_url: input.portfolio_url,
        twitter_url: input.twitter_url,
        years_of_experience: input.years_of_experience,
        looking_for: input.looking_for,
        availability: input.availability,
        profile_status: 'active' // Default status for new profiles
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User profile creation failed:', error);
    throw error;
  }
};