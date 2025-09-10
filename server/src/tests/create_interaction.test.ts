import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, userInteractionsTable, matchesTable } from '../db/schema';
import { type CreateInteractionInput } from '../schema';
import { createInteraction } from '../handlers/create_interaction';
import { eq, and } from 'drizzle-orm';

describe('createInteraction', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test users
  const createTestUsers = async () => {
    const users = await db.insert(userProfilesTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1',
          first_name: 'User',
          last_name: 'One',
          profile_status: 'active'
        },
        {
          email: 'user2@example.com',
          username: 'user2',
          first_name: 'User',
          last_name: 'Two',
          profile_status: 'active'
        }
      ])
      .returning({ id: userProfilesTable.id })
      .execute();

    return { user1Id: users[0].id, user2Id: users[1].id };
  };

  it('should create a like interaction', async () => {
    const { user1Id, user2Id } = await createTestUsers();

    const input: CreateInteractionInput = {
      user_id: user1Id,
      target_user_id: user2Id,
      interaction_type: 'like'
    };

    const result = await createInteraction(input);

    // Verify interaction was created
    expect(result.interaction.id).toBeDefined();
    expect(result.interaction.user_id).toEqual(user1Id);
    expect(result.interaction.target_user_id).toEqual(user2Id);
    expect(result.interaction.interaction_type).toEqual('like');
    expect(result.interaction.created_at).toBeInstanceOf(Date);

    // No match should be created yet (no mutual like)
    expect(result.match).toBeUndefined();
  });

  it('should create a pass interaction', async () => {
    const { user1Id, user2Id } = await createTestUsers();

    const input: CreateInteractionInput = {
      user_id: user1Id,
      target_user_id: user2Id,
      interaction_type: 'pass'
    };

    const result = await createInteraction(input);

    // Verify interaction was created
    expect(result.interaction.id).toBeDefined();
    expect(result.interaction.user_id).toEqual(user1Id);
    expect(result.interaction.target_user_id).toEqual(user2Id);
    expect(result.interaction.interaction_type).toEqual('pass');
    expect(result.interaction.created_at).toBeInstanceOf(Date);

    // No match should be created for pass
    expect(result.match).toBeUndefined();
  });

  it('should save interaction to database', async () => {
    const { user1Id, user2Id } = await createTestUsers();

    const input: CreateInteractionInput = {
      user_id: user1Id,
      target_user_id: user2Id,
      interaction_type: 'like'
    };

    const result = await createInteraction(input);

    // Query database to verify interaction was saved
    const interactions = await db.select()
      .from(userInteractionsTable)
      .where(eq(userInteractionsTable.id, result.interaction.id))
      .execute();

    expect(interactions).toHaveLength(1);
    expect(interactions[0].user_id).toEqual(user1Id);
    expect(interactions[0].target_user_id).toEqual(user2Id);
    expect(interactions[0].interaction_type).toEqual('like');
  });

  it('should create match when both users like each other', async () => {
    const { user1Id, user2Id } = await createTestUsers();

    // First user likes second user
    await createInteraction({
      user_id: user1Id,
      target_user_id: user2Id,
      interaction_type: 'like'
    });

    // Second user likes first user - this should create a match
    const result = await createInteraction({
      user_id: user2Id,
      target_user_id: user1Id,
      interaction_type: 'like'
    });

    // Verify match was created
    expect(result.match).toBeDefined();
    expect(result.match!.id).toBeDefined();
    expect(result.match!.user1_id).toEqual(Math.min(user1Id, user2Id));
    expect(result.match!.user2_id).toEqual(Math.max(user1Id, user2Id));
    expect(result.match!.status).toEqual('active');
    expect(result.match!.created_at).toBeInstanceOf(Date);
    expect(result.match!.updated_at).toBeInstanceOf(Date);

    // Verify match was saved to database
    const matches = await db.select()
      .from(matchesTable)
      .where(eq(matchesTable.id, result.match!.id))
      .execute();

    expect(matches).toHaveLength(1);
  });

  it('should not create match for pass interactions', async () => {
    const { user1Id, user2Id } = await createTestUsers();

    // First user likes second user
    await createInteraction({
      user_id: user1Id,
      target_user_id: user2Id,
      interaction_type: 'like'
    });

    // Second user passes on first user - no match should be created
    const result = await createInteraction({
      user_id: user2Id,
      target_user_id: user1Id,
      interaction_type: 'pass'
    });

    expect(result.match).toBeUndefined();

    // Verify no match exists in database
    const matches = await db.select()
      .from(matchesTable)
      .where(and(
        eq(matchesTable.user1_id, Math.min(user1Id, user2Id)),
        eq(matchesTable.user2_id, Math.max(user1Id, user2Id))
      ))
      .execute();

    expect(matches).toHaveLength(0);
  });

  it('should prevent duplicate interactions', async () => {
    const { user1Id, user2Id } = await createTestUsers();

    const input: CreateInteractionInput = {
      user_id: user1Id,
      target_user_id: user2Id,
      interaction_type: 'like'
    };

    // First interaction should succeed
    await createInteraction(input);

    // Second identical interaction should fail
    await expect(createInteraction(input)).rejects.toThrow(/already interacted/i);
  });

  it('should prevent self-interaction', async () => {
    const { user1Id } = await createTestUsers();

    const input: CreateInteractionInput = {
      user_id: user1Id,
      target_user_id: user1Id,
      interaction_type: 'like'
    };

    await expect(createInteraction(input)).rejects.toThrow(/cannot interact with themselves/i);
  });

  it('should throw error if user does not exist', async () => {
    const { user1Id } = await createTestUsers();

    const input: CreateInteractionInput = {
      user_id: user1Id,
      target_user_id: 999999, // Non-existent user
      interaction_type: 'like'
    };

    await expect(createInteraction(input)).rejects.toThrow(/do not exist/i);
  });

  it('should throw error if target user does not exist', async () => {
    const { user1Id } = await createTestUsers();

    const input: CreateInteractionInput = {
      user_id: 999999, // Non-existent user
      target_user_id: user1Id,
      interaction_type: 'like'
    };

    await expect(createInteraction(input)).rejects.toThrow(/do not exist/i);
  });

  it('should not create duplicate matches', async () => {
    const { user1Id, user2Id } = await createTestUsers();

    // Create initial mutual likes and match
    await createInteraction({
      user_id: user1Id,
      target_user_id: user2Id,
      interaction_type: 'like'
    });

    await createInteraction({
      user_id: user2Id,
      target_user_id: user1Id,
      interaction_type: 'like'
    });

    // Verify one match exists
    const initialMatches = await db.select()
      .from(matchesTable)
      .where(and(
        eq(matchesTable.user1_id, Math.min(user1Id, user2Id)),
        eq(matchesTable.user2_id, Math.max(user1Id, user2Id))
      ))
      .execute();

    expect(initialMatches).toHaveLength(1);

    // Create a third user and have both existing users interact with them
    const user3 = await db.insert(userProfilesTable)
      .values({
        email: 'user3@example.com',
        username: 'user3',
        first_name: 'User',
        last_name: 'Three',
        profile_status: 'active'
      })
      .returning({ id: userProfilesTable.id })
      .execute();

    const user3Id = user3[0].id;

    // This interaction shouldn't affect the existing match count
    await createInteraction({
      user_id: user1Id,
      target_user_id: user3Id,
      interaction_type: 'like'
    });

    // Verify still only one match between user1 and user2
    const finalMatches = await db.select()
      .from(matchesTable)
      .where(and(
        eq(matchesTable.user1_id, Math.min(user1Id, user2Id)),
        eq(matchesTable.user2_id, Math.max(user1Id, user2Id))
      ))
      .execute();

    expect(finalMatches).toHaveLength(1);
  });
});