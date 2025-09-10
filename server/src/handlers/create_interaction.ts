import { db } from '../db';
import { userInteractionsTable, matchesTable, userProfilesTable } from '../db/schema';
import { type CreateInteractionInput, type UserInteraction, type Match } from '../schema';
import { eq, and, or } from 'drizzle-orm';

export const createInteraction = async (input: CreateInteractionInput): Promise<{ interaction: UserInteraction; match?: Match }> => {
  try {
    // Prevent self-interaction
    if (input.user_id === input.target_user_id) {
      throw new Error('Users cannot interact with themselves');
    }

    // Validate that both users exist
    const users = await db.select({ id: userProfilesTable.id })
      .from(userProfilesTable)
      .where(or(
        eq(userProfilesTable.id, input.user_id),
        eq(userProfilesTable.id, input.target_user_id)
      ))
      .execute();

    if (users.length !== 2) {
      throw new Error('One or both users do not exist');
    }

    // Check if interaction already exists
    const existingInteraction = await db.select()
      .from(userInteractionsTable)
      .where(and(
        eq(userInteractionsTable.user_id, input.user_id),
        eq(userInteractionsTable.target_user_id, input.target_user_id)
      ))
      .execute();

    if (existingInteraction.length > 0) {
      throw new Error('User has already interacted with this profile');
    }

    // Create the interaction
    const interactionResult = await db.insert(userInteractionsTable)
      .values({
        user_id: input.user_id,
        target_user_id: input.target_user_id,
        interaction_type: input.interaction_type
      })
      .returning()
      .execute();

    const interaction = interactionResult[0];

    let match: Match | undefined = undefined;

    // If this is a 'like', check if target user has also liked this user
    if (input.interaction_type === 'like') {
      const mutualLike = await db.select()
        .from(userInteractionsTable)
        .where(and(
          eq(userInteractionsTable.user_id, input.target_user_id),
          eq(userInteractionsTable.target_user_id, input.user_id),
          eq(userInteractionsTable.interaction_type, 'like')
        ))
        .execute();

      if (mutualLike.length > 0) {
        // Check if match already exists to avoid duplicates
        const user1Id = Math.min(input.user_id, input.target_user_id);
        const user2Id = Math.max(input.user_id, input.target_user_id);

        const existingMatch = await db.select()
          .from(matchesTable)
          .where(and(
            eq(matchesTable.user1_id, user1Id),
            eq(matchesTable.user2_id, user2Id)
          ))
          .execute();

        if (existingMatch.length === 0) {
          // Create a match
          const matchResult = await db.insert(matchesTable)
            .values({
              user1_id: user1Id,
              user2_id: user2Id,
              status: 'active'
            })
            .returning()
            .execute();

          match = matchResult[0];
        }
      }
    }

    return { interaction, match };
  } catch (error) {
    console.error('Interaction creation failed:', error);
    throw error;
  }
};