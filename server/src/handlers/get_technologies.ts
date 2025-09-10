import { db } from '../db';
import { technologiesTable } from '../db/schema';
import { type Technology } from '../schema';
import { eq, asc } from 'drizzle-orm';

export interface GetTechnologiesFilters {
  category?: string;
}

export const getTechnologies = async (filters?: GetTechnologiesFilters): Promise<Technology[]> => {
  try {
    if (filters?.category) {
      // Query with category filter
      const results = await db.select()
        .from(technologiesTable)
        .where(eq(technologiesTable.category, filters.category))
        .orderBy(asc(technologiesTable.name))
        .execute();
      
      return results;
    } else {
      // Query without filter
      const results = await db.select()
        .from(technologiesTable)
        .orderBy(asc(technologiesTable.name))
        .execute();
      
      return results;
    }
  } catch (error) {
    console.error('Failed to fetch technologies:', error);
    throw error;
  }
};