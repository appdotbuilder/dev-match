import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, matchesTable, messagesTable } from '../db/schema';
import { type SendMessageInput } from '../schema';
import { sendMessage } from '../handlers/send_message';
import { eq } from 'drizzle-orm';

// Test input
const testInput: SendMessageInput = {
  match_id: 1,
  sender_id: 1,
  content: 'Hello! Nice to meet you!'
};

describe('sendMessage', () => {
  let user1Id: number;
  let user2Id: number;
  let user3Id: number;
  let activeMatchId: number;
  let archivedMatchId: number;

  beforeEach(async () => {
    await createDB();

    // Create test users
    const user1Result = await db.insert(userProfilesTable)
      .values({
        email: 'user1@example.com',
        username: 'user1',
        first_name: 'User',
        last_name: 'One',
        profile_status: 'active'
      })
      .returning()
      .execute();
    user1Id = user1Result[0].id;

    const user2Result = await db.insert(userProfilesTable)
      .values({
        email: 'user2@example.com',
        username: 'user2',
        first_name: 'User',
        last_name: 'Two',
        profile_status: 'active'
      })
      .returning()
      .execute();
    user2Id = user2Result[0].id;

    const user3Result = await db.insert(userProfilesTable)
      .values({
        email: 'user3@example.com',
        username: 'user3',
        first_name: 'User',
        last_name: 'Three',
        profile_status: 'active'
      })
      .returning()
      .execute();
    user3Id = user3Result[0].id;

    // Create active match between user1 and user2
    const activeMatchResult = await db.insert(matchesTable)
      .values({
        user1_id: user1Id,
        user2_id: user2Id,
        status: 'active'
      })
      .returning()
      .execute();
    activeMatchId = activeMatchResult[0].id;

    // Create archived match between user1 and user3
    const archivedMatchResult = await db.insert(matchesTable)
      .values({
        user1_id: user1Id,
        user2_id: user3Id,
        status: 'archived'
      })
      .returning()
      .execute();
    archivedMatchId = archivedMatchResult[0].id;
  });

  afterEach(resetDB);

  it('should send message from user1 in active match', async () => {
    const input: SendMessageInput = {
      match_id: activeMatchId,
      sender_id: user1Id,
      content: 'Hello from user1!'
    };

    const result = await sendMessage(input);

    // Verify message fields
    expect(result.match_id).toEqual(activeMatchId);
    expect(result.sender_id).toEqual(user1Id);
    expect(result.content).toEqual('Hello from user1!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.read_at).toBeNull();
  });

  it('should send message from user2 in active match', async () => {
    const input: SendMessageInput = {
      match_id: activeMatchId,
      sender_id: user2Id,
      content: 'Hello from user2!'
    };

    const result = await sendMessage(input);

    // Verify message fields
    expect(result.match_id).toEqual(activeMatchId);
    expect(result.sender_id).toEqual(user2Id);
    expect(result.content).toEqual('Hello from user2!');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.read_at).toBeNull();
  });

  it('should save message to database', async () => {
    const input: SendMessageInput = {
      match_id: activeMatchId,
      sender_id: user1Id,
      content: 'Test message content'
    };

    const result = await sendMessage(input);

    // Verify message is saved in database
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    expect(messages[0].match_id).toEqual(activeMatchId);
    expect(messages[0].sender_id).toEqual(user1Id);
    expect(messages[0].content).toEqual('Test message content');
    expect(messages[0].created_at).toBeInstanceOf(Date);
    expect(messages[0].read_at).toBeNull();
  });

  it('should handle long message content', async () => {
    const longContent = 'A'.repeat(2000); // Max allowed length
    const input: SendMessageInput = {
      match_id: activeMatchId,
      sender_id: user1Id,
      content: longContent
    };

    const result = await sendMessage(input);

    expect(result.content).toEqual(longContent);
    expect(result.content.length).toEqual(2000);
  });

  it('should reject message from user not in the match', async () => {
    const input: SendMessageInput = {
      match_id: activeMatchId,
      sender_id: user3Id, // user3 is not part of activeMatch
      content: 'I should not be able to send this'
    };

    await expect(sendMessage(input)).rejects.toThrow(/Match not found or sender is not part of this match/i);
  });

  it('should reject message to non-existent match', async () => {
    const input: SendMessageInput = {
      match_id: 999, // Non-existent match
      sender_id: user1Id,
      content: 'This match does not exist'
    };

    await expect(sendMessage(input)).rejects.toThrow(/Match not found or sender is not part of this match/i);
  });

  it('should reject message to archived match', async () => {
    const input: SendMessageInput = {
      match_id: archivedMatchId,
      sender_id: user1Id, // user1 is part of this match, but it's archived
      content: 'Cannot send to archived match'
    };

    await expect(sendMessage(input)).rejects.toThrow(/Cannot send message to archived match/i);
  });

  it('should allow multiple messages in same match', async () => {
    const input1: SendMessageInput = {
      match_id: activeMatchId,
      sender_id: user1Id,
      content: 'First message'
    };

    const input2: SendMessageInput = {
      match_id: activeMatchId,
      sender_id: user2Id,
      content: 'Second message'
    };

    const input3: SendMessageInput = {
      match_id: activeMatchId,
      sender_id: user1Id,
      content: 'Third message'
    };

    const result1 = await sendMessage(input1);
    const result2 = await sendMessage(input2);
    const result3 = await sendMessage(input3);

    // All messages should be created successfully
    expect(result1.content).toEqual('First message');
    expect(result2.content).toEqual('Second message');
    expect(result3.content).toEqual('Third message');

    // Verify all messages are in the database
    const allMessages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.match_id, activeMatchId))
      .execute();

    expect(allMessages).toHaveLength(3);
  });

  it('should handle match where user is user2', async () => {
    // Create a match where our sender is user2_id instead of user1_id
    const matchResult = await db.insert(matchesTable)
      .values({
        user1_id: user3Id, // Different user as user1
        user2_id: user1Id, // Our sender as user2
        status: 'active'
      })
      .returning()
      .execute();

    const input: SendMessageInput = {
      match_id: matchResult[0].id,
      sender_id: user1Id, // user1 is user2_id in this match
      content: 'Message from user2 position'
    };

    const result = await sendMessage(input);

    expect(result.sender_id).toEqual(user1Id);
    expect(result.content).toEqual('Message from user2 position');
  });
});