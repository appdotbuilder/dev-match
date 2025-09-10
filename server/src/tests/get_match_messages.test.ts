import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, matchesTable, messagesTable } from '../db/schema';
import { type GetMatchMessagesInput } from '../schema';
import { getMatchMessages } from '../handlers/get_match_messages';

describe('getMatchMessages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch messages for a match', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1',
          first_name: 'User',
          last_name: 'One'
        },
        {
          email: 'user2@example.com',
          username: 'user2',
          first_name: 'User',
          last_name: 'Two'
        }
      ])
      .returning()
      .execute();

    // Create a match
    const matches = await db.insert(matchesTable)
      .values({
        user1_id: users[0].id,
        user2_id: users[1].id
      })
      .returning()
      .execute();

    // Create test messages one by one to ensure proper ordering
    const message1 = await db.insert(messagesTable)
      .values({
        match_id: matches[0].id,
        sender_id: users[0].id,
        content: 'Hello there!'
      })
      .returning()
      .execute();

    const message2 = await db.insert(messagesTable)
      .values({
        match_id: matches[0].id,
        sender_id: users[1].id,
        content: 'Hi back!'
      })
      .returning()
      .execute();

    const message3 = await db.insert(messagesTable)
      .values({
        match_id: matches[0].id,
        sender_id: users[0].id,
        content: 'How are you doing?'
      })
      .returning()
      .execute();

    const input: GetMatchMessagesInput = {
      match_id: matches[0].id,
      limit: 10,
      offset: 0
    };

    const result = await getMatchMessages(input);

    // Should return all 3 messages
    expect(result).toHaveLength(3);
    
    // Messages should be ordered by creation time (newest first)
    expect(result[0].content).toEqual('How are you doing?');
    expect(result[1].content).toEqual('Hi back!');
    expect(result[2].content).toEqual('Hello there!');
    
    // Verify message structure
    expect(result[0].match_id).toEqual(matches[0].id);
    expect(result[0].sender_id).toEqual(users[0].id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].read_at).toBeNull();
  });

  it('should respect pagination with limit', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1',
          first_name: 'User',
          last_name: 'One'
        },
        {
          email: 'user2@example.com',
          username: 'user2',
          first_name: 'User',
          last_name: 'Two'
        }
      ])
      .returning()
      .execute();

    // Create a match
    const matches = await db.insert(matchesTable)
      .values({
        user1_id: users[0].id,
        user2_id: users[1].id
      })
      .returning()
      .execute();

    // Create 5 test messages one by one to ensure proper ordering
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[0].id, content: 'Message 1' })
      .execute();
    
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[1].id, content: 'Message 2' })
      .execute();
    
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[0].id, content: 'Message 3' })
      .execute();
    
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[1].id, content: 'Message 4' })
      .execute();
    
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[0].id, content: 'Message 5' })
      .execute();

    const input: GetMatchMessagesInput = {
      match_id: matches[0].id,
      limit: 3,
      offset: 0
    };

    const result = await getMatchMessages(input);

    // Should only return 3 messages
    expect(result).toHaveLength(3);
    
    // Should be the 3 newest messages
    expect(result[0].content).toEqual('Message 5');
    expect(result[1].content).toEqual('Message 4');
    expect(result[2].content).toEqual('Message 3');
  });

  it('should respect pagination with offset', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1',
          first_name: 'User',
          last_name: 'One'
        },
        {
          email: 'user2@example.com',
          username: 'user2',
          first_name: 'User',
          last_name: 'Two'
        }
      ])
      .returning()
      .execute();

    // Create a match
    const matches = await db.insert(matchesTable)
      .values({
        user1_id: users[0].id,
        user2_id: users[1].id
      })
      .returning()
      .execute();

    // Create 5 test messages one by one to ensure proper ordering
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[0].id, content: 'Message 1' })
      .execute();
    
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[1].id, content: 'Message 2' })
      .execute();
    
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[0].id, content: 'Message 3' })
      .execute();
    
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[1].id, content: 'Message 4' })
      .execute();
    
    await db.insert(messagesTable)
      .values({ match_id: matches[0].id, sender_id: users[0].id, content: 'Message 5' })
      .execute();

    const input: GetMatchMessagesInput = {
      match_id: matches[0].id,
      limit: 2,
      offset: 2
    };

    const result = await getMatchMessages(input);

    // Should return 2 messages starting from offset 2
    expect(result).toHaveLength(2);
    
    // Should skip the first 2 newest messages and return the next 2
    expect(result[0].content).toEqual('Message 3');
    expect(result[1].content).toEqual('Message 2');
  });

  it('should return empty array when no messages exist for match', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1',
          first_name: 'User',
          last_name: 'One'
        },
        {
          email: 'user2@example.com',
          username: 'user2',
          first_name: 'User',
          last_name: 'Two'
        }
      ])
      .returning()
      .execute();

    // Create a match but no messages
    const matches = await db.insert(matchesTable)
      .values({
        user1_id: users[0].id,
        user2_id: users[1].id
      })
      .returning()
      .execute();

    const input: GetMatchMessagesInput = {
      match_id: matches[0].id,
      limit: 10,
      offset: 0
    };

    const result = await getMatchMessages(input);

    expect(result).toHaveLength(0);
  });

  it('should throw error when match does not exist', async () => {
    const input: GetMatchMessagesInput = {
      match_id: 999999, // Non-existent match ID
      limit: 10,
      offset: 0
    };

    await expect(getMatchMessages(input)).rejects.toThrow(/Match with id 999999 not found/i);
  });

  it('should handle messages with read_at timestamps', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1',
          first_name: 'User',
          last_name: 'One'
        },
        {
          email: 'user2@example.com',
          username: 'user2',
          first_name: 'User',
          last_name: 'Two'
        }
      ])
      .returning()
      .execute();

    // Create a match
    const matches = await db.insert(matchesTable)
      .values({
        user1_id: users[0].id,
        user2_id: users[1].id
      })
      .returning()
      .execute();

    const readTimestamp = new Date();

    // Create messages with read_at timestamps
    const messages = await db.insert(messagesTable)
      .values([
        {
          match_id: matches[0].id,
          sender_id: users[0].id,
          content: 'Read message',
          read_at: readTimestamp
        },
        {
          match_id: matches[0].id,
          sender_id: users[1].id,
          content: 'Unread message',
          read_at: null
        }
      ])
      .returning()
      .execute();

    const input: GetMatchMessagesInput = {
      match_id: matches[0].id,
      limit: 10,
      offset: 0
    };

    const result = await getMatchMessages(input);

    expect(result).toHaveLength(2);
    
    // Find the messages in the result (order may vary due to timestamps)
    const readMessage = result.find(msg => msg.content === 'Read message');
    const unreadMessage = result.find(msg => msg.content === 'Unread message');
    
    expect(readMessage?.read_at).toBeInstanceOf(Date);
    expect(unreadMessage?.read_at).toBeNull();
  });

  it('should only return messages for the specified match', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1',
          first_name: 'User',
          last_name: 'One'
        },
        {
          email: 'user2@example.com',
          username: 'user2',
          first_name: 'User',
          last_name: 'Two'
        },
        {
          email: 'user3@example.com',
          username: 'user3',
          first_name: 'User',
          last_name: 'Three'
        }
      ])
      .returning()
      .execute();

    // Create two matches
    const matches = await db.insert(matchesTable)
      .values([
        {
          user1_id: users[0].id,
          user2_id: users[1].id
        },
        {
          user1_id: users[0].id,
          user2_id: users[2].id
        }
      ])
      .returning()
      .execute();

    // Create messages for both matches
    await db.insert(messagesTable)
      .values([
        {
          match_id: matches[0].id,
          sender_id: users[0].id,
          content: 'Message in match 1'
        },
        {
          match_id: matches[1].id,
          sender_id: users[0].id,
          content: 'Message in match 2'
        },
        {
          match_id: matches[0].id,
          sender_id: users[1].id,
          content: 'Another message in match 1'
        }
      ])
      .execute();

    const input: GetMatchMessagesInput = {
      match_id: matches[0].id,
      limit: 10,
      offset: 0
    };

    const result = await getMatchMessages(input);

    // Should only return messages from match 1
    expect(result).toHaveLength(2);
    result.forEach(message => {
      expect(message.match_id).toEqual(matches[0].id);
      expect(message.content).toMatch(/match 1/);
    });
  });
});