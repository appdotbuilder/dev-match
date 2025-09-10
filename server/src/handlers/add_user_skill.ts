import { db } from '../db';
import { userProgrammingLanguagesTable, userTechnologiesTable, userProfilesTable, programmingLanguagesTable, technologiesTable } from '../db/schema';
import { type AddUserSkillInput, type UserProgrammingLanguage, type UserTechnology } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function addUserSkill(input: AddUserSkillInput): Promise<UserProgrammingLanguage | UserTechnology> {
  try {
    // Verify the user exists
    const userExists = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    if (input.language_id) {
      // Verify the programming language exists
      const languageExists = await db.select()
        .from(programmingLanguagesTable)
        .where(eq(programmingLanguagesTable.id, input.language_id))
        .execute();

      if (languageExists.length === 0) {
        throw new Error(`Programming language with id ${input.language_id} not found`);
      }

      // Check if the user already has this skill
      const existingSkill = await db.select()
        .from(userProgrammingLanguagesTable)
        .where(and(
          eq(userProgrammingLanguagesTable.user_id, input.user_id),
          eq(userProgrammingLanguagesTable.language_id, input.language_id)
        ))
        .execute();

      if (existingSkill.length > 0) {
        throw new Error(`User already has programming language skill with id ${input.language_id}`);
      }

      // Insert the new skill
      const result = await db.insert(userProgrammingLanguagesTable)
        .values({
          user_id: input.user_id,
          language_id: input.language_id,
          proficiency_level: input.proficiency_level
        })
        .returning()
        .execute();

      return result[0];
    } else {
      // Verify the technology exists
      const technologyExists = await db.select()
        .from(technologiesTable)
        .where(eq(technologiesTable.id, input.technology_id!))
        .execute();

      if (technologyExists.length === 0) {
        throw new Error(`Technology with id ${input.technology_id} not found`);
      }

      // Check if the user already has this skill
      const existingSkill = await db.select()
        .from(userTechnologiesTable)
        .where(and(
          eq(userTechnologiesTable.user_id, input.user_id),
          eq(userTechnologiesTable.technology_id, input.technology_id!)
        ))
        .execute();

      if (existingSkill.length > 0) {
        throw new Error(`User already has technology skill with id ${input.technology_id}`);
      }

      // Insert the new skill
      const result = await db.insert(userTechnologiesTable)
        .values({
          user_id: input.user_id,
          technology_id: input.technology_id!,
          proficiency_level: input.proficiency_level
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Add user skill failed:', error);
    throw error;
  }
}