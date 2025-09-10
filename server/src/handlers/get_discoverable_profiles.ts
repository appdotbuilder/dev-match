import { db } from '../db';
import { 
  userProfilesTable, 
  userInteractionsTable,
  userProgrammingLanguagesTable,
  programmingLanguagesTable,
  userTechnologiesTable,
  technologiesTable
} from '../db/schema';
import { type GetDiscoverableProfilesInput, type UserProfile } from '../schema';
import { eq, ne, notInArray, and, desc, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getDiscoverableProfiles(input: GetDiscoverableProfilesInput): Promise<UserProfile[]> {
  try {
    // Get list of user IDs that the current user has already interacted with
    const interactedUserIds = await db.select({ target_user_id: userInteractionsTable.target_user_id })
      .from(userInteractionsTable)
      .where(eq(userInteractionsTable.user_id, input.user_id))
      .execute();

    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    
    // Exclude the user's own profile
    conditions.push(ne(userProfilesTable.id, input.user_id));
    
    // Only show active profiles
    conditions.push(eq(userProfilesTable.profile_status, 'active'));
    
    // Exclude profiles the user has already interacted with
    if (interactedUserIds.length > 0) {
      const interactedIds = interactedUserIds.map(row => row.target_user_id);
      conditions.push(notInArray(userProfilesTable.id, interactedIds));
    }

    // Build query step by step to avoid TypeScript issues
    const baseQuery = db.select()
      .from(userProfilesTable);
    
    const queryWithConditions = baseQuery.where(and(...conditions));
    const queryWithOrder = queryWithConditions.orderBy(desc(userProfilesTable.created_at));
    const finalQuery = queryWithOrder.limit(input.limit).offset(input.offset);

    const results = await finalQuery.execute();

    // Convert the results to match the UserProfile schema
    return results.map(profile => ({
      ...profile,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }));
  } catch (error) {
    console.error('Get discoverable profiles failed:', error);
    throw error;
  }
}