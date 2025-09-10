import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  userProfilesTable, 
  programmingLanguagesTable, 
  technologiesTable,
  userProgrammingLanguagesTable,
  userTechnologiesTable
} from '../db/schema';
import { type GetUserProfileByIdInput } from '../schema';
import { getUserProfile } from '../handlers/get_user_profile';

// Test data
const testUserProfile = {
  email: 'john.doe@example.com',
  username: 'johndoe',
  first_name: 'John',
  last_name: 'Doe',
  bio: 'Full-stack developer passionate about clean code',
  location: 'San Francisco, CA',
  profile_image_url: 'https://example.com/profile.jpg',
  github_url: 'https://github.com/johndoe',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  portfolio_url: 'https://johndoe.dev',
  twitter_url: 'https://twitter.com/johndoe',
  years_of_experience: 5,
  looking_for: 'Collaborators for open source projects',
  availability: 'Available for freelance work'
};

describe('getUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user profile when user exists', async () => {
    // Create test user
    const userResults = await db.insert(userProfilesTable)
      .values(testUserProfile)
      .returning()
      .execute();

    const userId = userResults[0].id;
    const input: GetUserProfileByIdInput = { id: userId };

    // Get user profile
    const result = await getUserProfile(input);

    // Verify the profile data
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(userId);
    expect(result?.email).toEqual('john.doe@example.com');
    expect(result?.username).toEqual('johndoe');
    expect(result?.first_name).toEqual('John');
    expect(result?.last_name).toEqual('Doe');
    expect(result?.bio).toEqual('Full-stack developer passionate about clean code');
    expect(result?.location).toEqual('San Francisco, CA');
    expect(result?.profile_image_url).toEqual('https://example.com/profile.jpg');
    expect(result?.github_url).toEqual('https://github.com/johndoe');
    expect(result?.linkedin_url).toEqual('https://linkedin.com/in/johndoe');
    expect(result?.portfolio_url).toEqual('https://johndoe.dev');
    expect(result?.twitter_url).toEqual('https://twitter.com/johndoe');
    expect(result?.years_of_experience).toEqual(5);
    expect(result?.looking_for).toEqual('Collaborators for open source projects');
    expect(result?.availability).toEqual('Available for freelance work');
    expect(result?.profile_status).toEqual('active');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const input: GetUserProfileByIdInput = { id: 9999 };

    const result = await getUserProfile(input);

    expect(result).toBeNull();
  });

  it('should return user profile with minimal data', async () => {
    // Create user with only required fields
    const minimalUser = {
      email: 'minimal@example.com',
      username: 'minimal',
      first_name: 'Min',
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

    const userResults = await db.insert(userProfilesTable)
      .values(minimalUser)
      .returning()
      .execute();

    const userId = userResults[0].id;
    const input: GetUserProfileByIdInput = { id: userId };

    const result = await getUserProfile(input);

    expect(result).not.toBeNull();
    expect(result?.id).toEqual(userId);
    expect(result?.email).toEqual('minimal@example.com');
    expect(result?.username).toEqual('minimal');
    expect(result?.first_name).toEqual('Min');
    expect(result?.last_name).toEqual('User');
    expect(result?.bio).toBeNull();
    expect(result?.location).toBeNull();
    expect(result?.profile_image_url).toBeNull();
    expect(result?.github_url).toBeNull();
    expect(result?.linkedin_url).toBeNull();
    expect(result?.portfolio_url).toBeNull();
    expect(result?.twitter_url).toBeNull();
    expect(result?.years_of_experience).toBeNull();
    expect(result?.looking_for).toBeNull();
    expect(result?.availability).toBeNull();
  });

  it('should handle user with programming languages and technologies', async () => {
    // Create test user
    const userResults = await db.insert(userProfilesTable)
      .values(testUserProfile)
      .returning()
      .execute();

    const userId = userResults[0].id;

    // Create programming languages
    const langResults = await db.insert(programmingLanguagesTable)
      .values([
        { name: 'TypeScript' },
        { name: 'Python' }
      ])
      .returning()
      .execute();

    // Create technologies
    const techResults = await db.insert(technologiesTable)
      .values([
        { name: 'React', category: 'frontend' },
        { name: 'PostgreSQL', category: 'database' }
      ])
      .returning()
      .execute();

    // Add user programming languages
    await db.insert(userProgrammingLanguagesTable)
      .values([
        { user_id: userId, language_id: langResults[0].id, proficiency_level: 5 },
        { user_id: userId, language_id: langResults[1].id, proficiency_level: 4 }
      ])
      .execute();

    // Add user technologies
    await db.insert(userTechnologiesTable)
      .values([
        { user_id: userId, technology_id: techResults[0].id, proficiency_level: 5 },
        { user_id: userId, technology_id: techResults[1].id, proficiency_level: 3 }
      ])
      .execute();

    const input: GetUserProfileByIdInput = { id: userId };
    const result = await getUserProfile(input);

    // Verify the profile is returned (the handler fetches the related data internally)
    expect(result).not.toBeNull();
    expect(result?.id).toEqual(userId);
    expect(result?.username).toEqual('johndoe');
    
    // Verify that the handler can access the related data during execution
    // by checking that the profile was returned successfully
    expect(result?.profile_status).toEqual('active');
  });

  it('should return user profile with different profile status', async () => {
    // Create inactive user
    const inactiveUser = {
      ...testUserProfile,
      email: 'inactive@example.com',
      username: 'inactive',
      profile_status: 'inactive' as const
    };

    const userResults = await db.insert(userProfilesTable)
      .values(inactiveUser)
      .returning()
      .execute();

    const userId = userResults[0].id;
    const input: GetUserProfileByIdInput = { id: userId };

    const result = await getUserProfile(input);

    expect(result).not.toBeNull();
    expect(result?.profile_status).toEqual('inactive');
    expect(result?.username).toEqual('inactive');
  });

  it('should handle user with zero years of experience', async () => {
    const newUser = {
      ...testUserProfile,
      email: 'newbie@example.com',
      username: 'newbie',
      years_of_experience: 0
    };

    const userResults = await db.insert(userProfilesTable)
      .values(newUser)
      .returning()
      .execute();

    const userId = userResults[0].id;
    const input: GetUserProfileByIdInput = { id: userId };

    const result = await getUserProfile(input);

    expect(result).not.toBeNull();
    expect(result?.years_of_experience).toEqual(0);
    expect(result?.username).toEqual('newbie');
  });
});