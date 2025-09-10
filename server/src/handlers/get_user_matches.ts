import { db } from '../db';
import { matchesTable } from '../db/schema';
import { type GetUserMatchesInput, type Match } from '../schema';
import { eq, or, and } from 'drizzle-orm';

export async function getUserMatches(input: GetUserMatchesInput): Promise<Match[]> {
  try {
    // Find all active matches where the user is either user1 or user2
    const results = await db.select()
      .from(matchesTable)
      .where(
        and(
          or(
            eq(matchesTable.user1_id, input.user_id),
            eq(matchesTable.user2_id, input.user_id)
          ),
          eq(matchesTable.status, 'active')
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch user matches:', error);
    throw error;
  }
}