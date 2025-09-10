import { db } from '../db';
import { programmingLanguagesTable } from '../db/schema';
import { type CreateProgrammingLanguageInput, type ProgrammingLanguage } from '../schema';

export const createProgrammingLanguage = async (input: CreateProgrammingLanguageInput): Promise<ProgrammingLanguage> => {
  try {
    // Insert programming language record
    const result = await db.insert(programmingLanguagesTable)
      .values({
        name: input.name
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Programming language creation failed:', error);
    throw error;
  }
};