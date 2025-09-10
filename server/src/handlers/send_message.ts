import { db } from '../db';
import { messagesTable, matchesTable } from '../db/schema';
import { type SendMessageInput, type Message } from '../schema';
import { eq, or, and } from 'drizzle-orm';

export const sendMessage = async (input: SendMessageInput): Promise<Message> => {
  try {
    // First, verify that the match exists and the sender is part of it
    const matchResults = await db.select()
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.id, input.match_id),
          or(
            eq(matchesTable.user1_id, input.sender_id),
            eq(matchesTable.user2_id, input.sender_id)
          )
        )
      )
      .execute();

    if (matchResults.length === 0) {
      throw new Error('Match not found or sender is not part of this match');
    }

    // Check if the match is active
    const match = matchResults[0];
    if (match.status !== 'active') {
      throw new Error('Cannot send message to archived match');
    }

    // Insert the message
    const result = await db.insert(messagesTable)
      .values({
        match_id: input.match_id,
        sender_id: input.sender_id,
        content: input.content
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Message sending failed:', error);
    throw error;
  }
};