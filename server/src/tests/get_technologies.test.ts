import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { technologiesTable } from '../db/schema';
import { getTechnologies } from '../handlers/get_technologies';

// Test data
const testTechnologies = [
  { name: 'React', category: 'frontend' },
  { name: 'Node.js', category: 'backend' },
  { name: 'PostgreSQL', category: 'database' },
  { name: 'Docker', category: 'devops' },
  { name: 'Vue.js', category: 'frontend' },
  { name: 'Redis', category: 'database' }
];

describe('getTechnologies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all technologies when no filter is provided', async () => {
    // Insert test data
    await db.insert(technologiesTable)
      .values(testTechnologies)
      .execute();

    const result = await getTechnologies();

    expect(result).toHaveLength(6);
    
    // Verify all technologies are returned and ordered by name
    const expectedOrder = ['Docker', 'Node.js', 'PostgreSQL', 'React', 'Redis', 'Vue.js'];
    result.forEach((tech, index) => {
      expect(tech.name).toEqual(expectedOrder[index]);
      expect(tech.id).toBeDefined();
      expect(tech.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no technologies exist', async () => {
    const result = await getTechnologies();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should filter technologies by category', async () => {
    // Insert test data
    await db.insert(technologiesTable)
      .values(testTechnologies)
      .execute();

    const result = await getTechnologies({ category: 'frontend' });

    expect(result).toHaveLength(2);
    expect(result.map(t => t.name).sort()).toEqual(['React', 'Vue.js']);
    
    // Verify all returned technologies have the correct category
    result.forEach(tech => {
      expect(tech.category).toEqual('frontend');
    });
  });

  it('should filter technologies by database category', async () => {
    // Insert test data
    await db.insert(technologiesTable)
      .values(testTechnologies)
      .execute();

    const result = await getTechnologies({ category: 'database' });

    expect(result).toHaveLength(2);
    expect(result.map(t => t.name).sort()).toEqual(['PostgreSQL', 'Redis']);
    
    result.forEach(tech => {
      expect(tech.category).toEqual('database');
    });
  });

  it('should return empty array when filtering by non-existent category', async () => {
    // Insert test data
    await db.insert(technologiesTable)
      .values(testTechnologies)
      .execute();

    const result = await getTechnologies({ category: 'nonexistent' });

    expect(result).toHaveLength(0);
  });

  it('should handle technologies with null categories', async () => {
    // Insert technologies with null categories
    const techsWithNulls = [
      { name: 'Git', category: null },
      { name: 'Linux', category: null },
      { name: 'React', category: 'frontend' }
    ];

    await db.insert(technologiesTable)
      .values(techsWithNulls)
      .execute();

    // Get all technologies
    const allResult = await getTechnologies();
    expect(allResult).toHaveLength(3);

    // Filter by specific category should not return null category items
    const frontendResult = await getTechnologies({ category: 'frontend' });
    expect(frontendResult).toHaveLength(1);
    expect(frontendResult[0].name).toEqual('React');
  });

  it('should maintain consistent ordering regardless of insertion order', async () => {
    // Insert in reverse alphabetical order
    const reverseTechs = [
      { name: 'Webpack', category: 'build' },
      { name: 'Angular', category: 'frontend' },
      { name: 'MongoDB', category: 'database' }
    ];

    await db.insert(technologiesTable)
      .values(reverseTechs)
      .execute();

    const result = await getTechnologies();

    // Should be ordered alphabetically regardless of insertion order
    expect(result.map(t => t.name)).toEqual(['Angular', 'MongoDB', 'Webpack']);
  });
});