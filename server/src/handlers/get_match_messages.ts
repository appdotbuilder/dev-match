import { db } from '../db';
import { messagesTable, matchesTable } from '../db/schema';
import { type GetMatchMessagesInput, type Message } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getMatchMessages(input: GetMatchMessagesInput): Promise<Message[]> {
  try {
    // First verify the match exists
    const matchExists = await db.select({ id: matchesTable.id })
      .from(matchesTable)
      .where(eq(matchesTable.id, input.match_id))
      .limit(1)
      .execute();

    if (matchExists.length === 0) {
      throw new Error(`Match with id ${input.match_id} not found`);
    }

    // Fetch messages for the match, ordered by creation time (newest first)
    // We use id as secondary sort to ensure consistent ordering when timestamps are identical
    const result = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.match_id, input.match_id))
      .orderBy(desc(messagesTable.created_at), desc(messagesTable.id))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    return result.map(message => ({
      ...message,
      created_at: message.created_at,
      read_at: message.read_at
    }));
  } catch (error) {
    console.error('Failed to fetch match messages:', error);
    throw error;
  }
}