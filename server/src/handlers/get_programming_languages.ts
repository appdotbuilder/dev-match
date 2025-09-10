import { db } from '../db';
import { programmingLanguagesTable } from '../db/schema';
import { type ProgrammingLanguage } from '../schema';
import { asc } from 'drizzle-orm';

export const getProgrammingLanguages = async (): Promise<ProgrammingLanguage[]> => {
  try {
    // Fetch all programming languages, ordered alphabetically by name
    const results = await db.select()
      .from(programmingLanguagesTable)
      .orderBy(asc(programmingLanguagesTable.name))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch programming languages:', error);
    throw error;
  }
};