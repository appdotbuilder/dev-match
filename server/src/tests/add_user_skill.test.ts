import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, programmingLanguagesTable, technologiesTable, userProgrammingLanguagesTable, userTechnologiesTable } from '../db/schema';
import { type AddUserSkillInput } from '../schema';
import { addUserSkill } from '../handlers/add_user_skill';
import { eq, and } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'test@example.com',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  bio: null,
  location: null,
  profile_image_url: null,
  github_url: null,
  linkedin_url: null,
  portfolio_url: null,
  twitter_url: null,
  years_of_experience: null,
  looking_for: null,
  availability: null
};

const testLanguage = {
  name: 'JavaScript'
};

const testTechnology = {
  name: 'React',
  category: 'frontend'
};

describe('addUserSkill', () => {
  let userId: number;
  let languageId: number;
  let technologyId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test user
    const userResult = await db.insert(userProfilesTable)
      .values(testUser)
      .returning()
      .execute();
    userId = userResult[0].id;

    // Create test programming language
    const languageResult = await db.insert(programmingLanguagesTable)
      .values(testLanguage)
      .returning()
      .execute();
    languageId = languageResult[0].id;

    // Create test technology
    const technologyResult = await db.insert(technologiesTable)
      .values(testTechnology)
      .returning()
      .execute();
    technologyId = technologyResult[0].id;
  });

  afterEach(resetDB);

  it('should add a programming language skill to user', async () => {
    const input: AddUserSkillInput = {
      user_id: userId,
      language_id: languageId,
      proficiency_level: 4
    };

    const result = await addUserSkill(input);

    // Verify the returned object
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(userId);
    expect('language_id' in result && result.language_id).toEqual(languageId);
    expect(result.proficiency_level).toEqual(4);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify it was saved to database
    const skillInDb = await db.select()
      .from(userProgrammingLanguagesTable)
      .where(eq(userProgrammingLanguagesTable.id, result.id))
      .execute();

    expect(skillInDb).toHaveLength(1);
    expect(skillInDb[0].user_id).toEqual(userId);
    expect(skillInDb[0].language_id).toEqual(languageId);
    expect(skillInDb[0].proficiency_level).toEqual(4);
  });

  it('should add a technology skill to user', async () => {
    const input: AddUserSkillInput = {
      user_id: userId,
      technology_id: technologyId,
      proficiency_level: 3
    };

    const result = await addUserSkill(input);

    // Verify the returned object
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(userId);
    expect('technology_id' in result && result.technology_id).toEqual(technologyId);
    expect(result.proficiency_level).toEqual(3);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify it was saved to database
    const skillInDb = await db.select()
      .from(userTechnologiesTable)
      .where(eq(userTechnologiesTable.id, result.id))
      .execute();

    expect(skillInDb).toHaveLength(1);
    expect(skillInDb[0].user_id).toEqual(userId);
    expect(skillInDb[0].technology_id).toEqual(technologyId);
    expect(skillInDb[0].proficiency_level).toEqual(3);
  });

  it('should throw error when user does not exist', async () => {
    const input: AddUserSkillInput = {
      user_id: 99999, // Non-existent user
      language_id: languageId,
      proficiency_level: 4
    };

    await expect(addUserSkill(input)).rejects.toThrow(/User with id 99999 not found/);
  });

  it('should throw error when programming language does not exist', async () => {
    const input: AddUserSkillInput = {
      user_id: userId,
      language_id: 99999, // Non-existent language
      proficiency_level: 4
    };

    await expect(addUserSkill(input)).rejects.toThrow(/Programming language with id 99999 not found/);
  });

  it('should throw error when technology does not exist', async () => {
    const input: AddUserSkillInput = {
      user_id: userId,
      technology_id: 99999, // Non-existent technology
      proficiency_level: 3
    };

    await expect(addUserSkill(input)).rejects.toThrow(/Technology with id 99999 not found/);
  });

  it('should prevent duplicate programming language skills', async () => {
    const input: AddUserSkillInput = {
      user_id: userId,
      language_id: languageId,
      proficiency_level: 4
    };

    // Add the skill first time
    await addUserSkill(input);

    // Try to add the same skill again
    await expect(addUserSkill(input)).rejects.toThrow(/User already has programming language skill with id/);
  });

  it('should prevent duplicate technology skills', async () => {
    const input: AddUserSkillInput = {
      user_id: userId,
      technology_id: technologyId,
      proficiency_level: 3
    };

    // Add the skill first time
    await addUserSkill(input);

    // Try to add the same skill again
    await expect(addUserSkill(input)).rejects.toThrow(/User already has technology skill with id/);
  });

  it('should allow same user to have different skills', async () => {
    const languageInput: AddUserSkillInput = {
      user_id: userId,
      language_id: languageId,
      proficiency_level: 4
    };

    const technologyInput: AddUserSkillInput = {
      user_id: userId,
      technology_id: technologyId,
      proficiency_level: 3
    };

    // Add both skills
    const languageResult = await addUserSkill(languageInput);
    const technologyResult = await addUserSkill(technologyInput);

    // Both should succeed
    expect(languageResult.id).toBeDefined();
    expect(technologyResult.id).toBeDefined();

    // Verify both are in database
    const languageSkills = await db.select()
      .from(userProgrammingLanguagesTable)
      .where(eq(userProgrammingLanguagesTable.user_id, userId))
      .execute();

    const technologySkills = await db.select()
      .from(userTechnologiesTable)
      .where(eq(userTechnologiesTable.user_id, userId))
      .execute();

    expect(languageSkills).toHaveLength(1);
    expect(technologySkills).toHaveLength(1);
  });

  it('should allow different users to have same skills', async () => {
    // Create another user
    const anotherUserResult = await db.insert(userProfilesTable)
      .values({
        ...testUser,
        email: 'another@example.com',
        username: 'anotheruser'
      })
      .returning()
      .execute();
    const anotherUserId = anotherUserResult[0].id;

    const input1: AddUserSkillInput = {
      user_id: userId,
      language_id: languageId,
      proficiency_level: 4
    };

    const input2: AddUserSkillInput = {
      user_id: anotherUserId,
      language_id: languageId,
      proficiency_level: 2
    };

    // Both users should be able to add the same language skill
    const result1 = await addUserSkill(input1);
    const result2 = await addUserSkill(input2);

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Verify both are in database
    const allLanguageSkills = await db.select()
      .from(userProgrammingLanguagesTable)
      .where(eq(userProgrammingLanguagesTable.language_id, languageId))
      .execute();

    expect(allLanguageSkills).toHaveLength(2);
  });
});