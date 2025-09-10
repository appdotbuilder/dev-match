import { type SendMessageInput, type Message } from '../schema';

export async function sendMessage(input: SendMessageInput): Promise<Message> {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is sending a message in a match conversation.
  // It should validate that the sender is part of the match before allowing the message.
  return Promise.resolve({
    id: 0, // Placeholder ID
    match_id: input.match_id,
    sender_id: input.sender_id,
    content: input.content,
    created_at: new Date(),
    read_at: null
  } as Message);
}