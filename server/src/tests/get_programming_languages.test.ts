import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programmingLanguagesTable } from '../db/schema';
import { getProgrammingLanguages } from '../handlers/get_programming_languages';

describe('getProgrammingLanguages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no programming languages exist', async () => {
    const result = await getProgrammingLanguages();

    expect(result).toEqual([]);
  });

  it('should return all programming languages', async () => {
    // Create test programming languages
    await db.insert(programmingLanguagesTable)
      .values([
        { name: 'JavaScript' },
        { name: 'TypeScript' },
        { name: 'Python' }
      ])
      .execute();

    const result = await getProgrammingLanguages();

    expect(result).toHaveLength(3);
    
    // Verify all required fields are present
    result.forEach(language => {
      expect(language.id).toBeDefined();
      expect(typeof language.id).toBe('number');
      expect(language.name).toBeDefined();
      expect(typeof language.name).toBe('string');
      expect(language.created_at).toBeInstanceOf(Date);
    });

    // Verify specific languages are included
    const languageNames = result.map(lang => lang.name);
    expect(languageNames).toContain('JavaScript');
    expect(languageNames).toContain('TypeScript');
    expect(languageNames).toContain('Python');
  });

  it('should return programming languages in alphabetical order', async () => {
    // Create test programming languages in non-alphabetical order
    await db.insert(programmingLanguagesTable)
      .values([
        { name: 'Rust' },
        { name: 'Go' },
        { name: 'C++' },
        { name: 'Java' },
        { name: 'Python' }
      ])
      .execute();

    const result = await getProgrammingLanguages();

    expect(result).toHaveLength(5);
    
    // Verify alphabetical ordering
    const languageNames = result.map(lang => lang.name);
    expect(languageNames).toEqual(['C++', 'Go', 'Java', 'Python', 'Rust']);
  });

  it('should handle single programming language', async () => {
    // Create single programming language
    await db.insert(programmingLanguagesTable)
      .values({ name: 'Haskell' })
      .execute();

    const result = await getProgrammingLanguages();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Haskell');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle many programming languages efficiently', async () => {
    // Create many programming languages
    const languageNames = [
      'Assembly', 'BASIC', 'C', 'C#', 'C++', 'COBOL', 'Dart', 'Elixir',
      'Erlang', 'F#', 'Fortran', 'Go', 'Haskell', 'Java', 'JavaScript',
      'Julia', 'Kotlin', 'Lisp', 'Lua', 'MATLAB', 'Objective-C', 'Pascal',
      'Perl', 'PHP', 'Python', 'R', 'Ruby', 'Rust', 'Scala', 'Swift',
      'TypeScript', 'VB.NET', 'Visual Basic'
    ];

    const languageData = languageNames.map(name => ({ name }));
    await db.insert(programmingLanguagesTable)
      .values(languageData)
      .execute();

    const result = await getProgrammingLanguages();

    expect(result).toHaveLength(languageNames.length);
    
    // Verify they're sorted alphabetically
    const resultNames = result.map(lang => lang.name);
    const sortedNames = [...languageNames].sort();
    expect(resultNames).toEqual(sortedNames);

    // Verify all have proper structure
    result.forEach(language => {
      expect(language.id).toBeDefined();
      expect(typeof language.id).toBe('number');
      expect(typeof language.name).toBe('string');
      expect(language.created_at).toBeInstanceOf(Date);
    });
  });
});