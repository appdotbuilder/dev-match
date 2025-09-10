import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programmingLanguagesTable } from '../db/schema';
import { type CreateProgrammingLanguageInput } from '../schema';
import { createProgrammingLanguage } from '../handlers/create_programming_language';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateProgrammingLanguageInput = {
  name: 'TypeScript'
};

describe('createProgrammingLanguage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a programming language', async () => {
    const result = await createProgrammingLanguage(testInput);

    // Basic field validation
    expect(result.name).toEqual('TypeScript');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save programming language to database', async () => {
    const result = await createProgrammingLanguage(testInput);

    // Query using proper drizzle syntax
    const languages = await db.select()
      .from(programmingLanguagesTable)
      .where(eq(programmingLanguagesTable.id, result.id))
      .execute();

    expect(languages).toHaveLength(1);
    expect(languages[0].name).toEqual('TypeScript');
    expect(languages[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle duplicate language names', async () => {
    // Create first language
    await createProgrammingLanguage(testInput);

    // Attempt to create duplicate - should throw error due to unique constraint
    await expect(createProgrammingLanguage(testInput))
      .rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should create multiple unique languages', async () => {
    const language1 = await createProgrammingLanguage({ name: 'JavaScript' });
    const language2 = await createProgrammingLanguage({ name: 'Python' });
    const language3 = await createProgrammingLanguage({ name: 'Rust' });

    // Verify all languages exist in database
    const allLanguages = await db.select()
      .from(programmingLanguagesTable)
      .execute();

    expect(allLanguages).toHaveLength(3);
    
    const languageNames = allLanguages.map(lang => lang.name).sort();
    expect(languageNames).toEqual(['JavaScript', 'Python', 'Rust']);

    // Verify each has unique ID
    const languageIds = allLanguages.map(lang => lang.id);
    expect(new Set(languageIds)).toHaveProperty('size', 3);
  });

  it('should trim and handle edge case names', async () => {
    const edgeCaseInput: CreateProgrammingLanguageInput = {
      name: 'C++'
    };

    const result = await createProgrammingLanguage(edgeCaseInput);

    expect(result.name).toEqual('C++');
    expect(result.id).toBeDefined();

    // Verify it's saved correctly
    const languages = await db.select()
      .from(programmingLanguagesTable)
      .where(eq(programmingLanguagesTable.name, 'C++'))
      .execute();

    expect(languages).toHaveLength(1);
    expect(languages[0].name).toEqual('C++');
  });
});