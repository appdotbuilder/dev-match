import { db } from '../db';
import { technologiesTable } from '../db/schema';
import { type CreateTechnologyInput, type Technology } from '../schema';

export async function createTechnology(input: CreateTechnologyInput): Promise<Technology> {
  try {
    // Insert technology record
    const result = await db.insert(technologiesTable)
      .values({
        name: input.name,
        category: input.category
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Technology creation failed:', error);
    throw error;
  }
}