import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { technologiesTable } from '../db/schema';
import { type CreateTechnologyInput } from '../schema';
import { createTechnology } from '../handlers/create_technology';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateTechnologyInput = {
  name: 'React',
  category: 'frontend'
};

const testInputWithoutCategory: CreateTechnologyInput = {
  name: 'Docker',
  category: null
};

describe('createTechnology', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a technology with category', async () => {
    const result = await createTechnology(testInput);

    // Basic field validation
    expect(result.name).toEqual('React');
    expect(result.category).toEqual('frontend');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a technology without category', async () => {
    const result = await createTechnology(testInputWithoutCategory);

    // Basic field validation
    expect(result.name).toEqual('Docker');
    expect(result.category).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save technology to database', async () => {
    const result = await createTechnology(testInput);

    // Query using proper drizzle syntax
    const technologies = await db.select()
      .from(technologiesTable)
      .where(eq(technologiesTable.id, result.id))
      .execute();

    expect(technologies).toHaveLength(1);
    expect(technologies[0].name).toEqual('React');
    expect(technologies[0].category).toEqual('frontend');
    expect(technologies[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle duplicate technology name', async () => {
    // Create first technology
    await createTechnology(testInput);

    // Try to create duplicate - should throw error
    await expect(createTechnology(testInput)).rejects.toThrow(/duplicate key|unique constraint/i);
  });

  it('should create technologies with different categories', async () => {
    const frontendTech: CreateTechnologyInput = {
      name: 'Vue.js',
      category: 'frontend'
    };

    const backendTech: CreateTechnologyInput = {
      name: 'Express.js',
      category: 'backend'
    };

    const result1 = await createTechnology(frontendTech);
    const result2 = await createTechnology(backendTech);

    expect(result1.name).toEqual('Vue.js');
    expect(result1.category).toEqual('frontend');
    expect(result2.name).toEqual('Express.js');
    expect(result2.category).toEqual('backend');

    // Verify both are in database
    const technologies = await db.select()
      .from(technologiesTable)
      .execute();

    expect(technologies).toHaveLength(2);
    expect(technologies.some(t => t.name === 'Vue.js' && t.category === 'frontend')).toBe(true);
    expect(technologies.some(t => t.name === 'Express.js' && t.category === 'backend')).toBe(true);
  });

  it('should allow same category for different technologies', async () => {
    const tech1: CreateTechnologyInput = {
      name: 'Angular',
      category: 'frontend'
    };

    const tech2: CreateTechnologyInput = {
      name: 'Svelte',
      category: 'frontend'
    };

    const result1 = await createTechnology(tech1);
    const result2 = await createTechnology(tech2);

    expect(result1.category).toEqual('frontend');
    expect(result2.category).toEqual('frontend');
    expect(result1.name).not.toEqual(result2.name);
  });
});