import { db } from '../db';
import { 
  userProfilesTable, 
  userProgrammingLanguagesTable, 
  userTechnologiesTable,
  programmingLanguagesTable,
  technologiesTable
} from '../db/schema';
import { type GetUserProfileByIdInput, type UserProfile } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserProfile(input: GetUserProfileByIdInput): Promise<UserProfile | null> {
  try {
    // Fetch user profile
    const userProfiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.id))
      .execute();

    if (userProfiles.length === 0) {
      return null;
    }

    const userProfile = userProfiles[0];

    // Fetch user's programming languages with details
    const userLanguages = await db.select({
      id: userProgrammingLanguagesTable.id,
      user_id: userProgrammingLanguagesTable.user_id,
      language_id: userProgrammingLanguagesTable.language_id,
      proficiency_level: userProgrammingLanguagesTable.proficiency_level,
      created_at: userProgrammingLanguagesTable.created_at,
      language_name: programmingLanguagesTable.name
    })
      .from(userProgrammingLanguagesTable)
      .innerJoin(
        programmingLanguagesTable,
        eq(userProgrammingLanguagesTable.language_id, programmingLanguagesTable.id)
      )
      .where(eq(userProgrammingLanguagesTable.user_id, input.id))
      .execute();

    // Fetch user's technologies with details
    const userTechnologies = await db.select({
      id: userTechnologiesTable.id,
      user_id: userTechnologiesTable.user_id,
      technology_id: userTechnologiesTable.technology_id,
      proficiency_level: userTechnologiesTable.proficiency_level,
      created_at: userTechnologiesTable.created_at,
      technology_name: technologiesTable.name,
      technology_category: technologiesTable.category
    })
      .from(userTechnologiesTable)
      .innerJoin(
        technologiesTable,
        eq(userTechnologiesTable.technology_id, technologiesTable.id)
      )
      .where(eq(userTechnologiesTable.user_id, input.id))
      .execute();

    // Return the complete user profile with related data
    return {
      ...userProfile,
      // Include the programming languages and technologies as part of the profile
      // These are included as additional context but the main UserProfile schema
      // doesn't explicitly include them, so we just return the base profile
    };
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
}