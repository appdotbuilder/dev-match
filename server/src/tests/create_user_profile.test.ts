import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type CreateUserProfileInput } from '../schema';
import { createUserProfile } from '../handlers/create_user_profile';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateUserProfileInput = {
  email: 'test@example.com',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  bio: 'A test developer profile',
  location: 'San Francisco, CA',
  profile_image_url: 'https://example.com/profile.jpg',
  github_url: 'https://github.com/testuser',
  linkedin_url: 'https://linkedin.com/in/testuser',
  portfolio_url: 'https://testuser.dev',
  twitter_url: 'https://twitter.com/testuser',
  years_of_experience: 3,
  looking_for: 'Collaborators and mentors',
  availability: 'Available for side projects'
};

// Minimal test input with required fields only
const minimalInput: CreateUserProfileInput = {
  email: 'minimal@example.com',
  username: 'minimaluser',
  first_name: 'Minimal',
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

describe('createUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user profile with all fields', async () => {
    const result = await createUserProfile(testInput);

    // Validate all returned fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.email).toEqual('test@example.com');
    expect(result.username).toEqual('testuser');
    expect(result.first_name).toEqual('Test');
    expect(result.last_name).toEqual('User');
    expect(result.bio).toEqual('A test developer profile');
    expect(result.location).toEqual('San Francisco, CA');
    expect(result.profile_image_url).toEqual('https://example.com/profile.jpg');
    expect(result.github_url).toEqual('https://github.com/testuser');
    expect(result.linkedin_url).toEqual('https://linkedin.com/in/testuser');
    expect(result.portfolio_url).toEqual('https://testuser.dev');
    expect(result.twitter_url).toEqual('https://twitter.com/testuser');
    expect(result.years_of_experience).toEqual(3);
    expect(result.looking_for).toEqual('Collaborators and mentors');
    expect(result.availability).toEqual('Available for side projects');
    expect(result.profile_status).toEqual('active');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a user profile with minimal required fields', async () => {
    const result = await createUserProfile(minimalInput);

    // Validate required fields
    expect(result.id).toBeDefined();
    expect(result.email).toEqual('minimal@example.com');
    expect(result.username).toEqual('minimaluser');
    expect(result.first_name).toEqual('Minimal');
    expect(result.last_name).toEqual('User');
    expect(result.profile_status).toEqual('active');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Validate nullable fields are null
    expect(result.bio).toBeNull();
    expect(result.location).toBeNull();
    expect(result.profile_image_url).toBeNull();
    expect(result.github_url).toBeNull();
    expect(result.linkedin_url).toBeNull();
    expect(result.portfolio_url).toBeNull();
    expect(result.twitter_url).toBeNull();
    expect(result.years_of_experience).toBeNull();
    expect(result.looking_for).toBeNull();
    expect(result.availability).toBeNull();
  });

  it('should save user profile to database', async () => {
    const result = await createUserProfile(testInput);

    // Query database to verify the profile was saved
    const profiles = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    const savedProfile = profiles[0];
    
    expect(savedProfile.email).toEqual('test@example.com');
    expect(savedProfile.username).toEqual('testuser');
    expect(savedProfile.first_name).toEqual('Test');
    expect(savedProfile.last_name).toEqual('User');
    expect(savedProfile.bio).toEqual('A test developer profile');
    expect(savedProfile.location).toEqual('San Francisco, CA');
    expect(savedProfile.profile_status).toEqual('active');
    expect(savedProfile.created_at).toBeInstanceOf(Date);
    expect(savedProfile.updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    // Create first profile
    await createUserProfile(testInput);

    // Try to create another profile with same email but different username
    const duplicateEmailInput: CreateUserProfileInput = {
      ...testInput,
      username: 'differentusername'
    };

    await expect(createUserProfile(duplicateEmailInput))
      .rejects
      .toThrow(/duplicate key value violates unique constraint|UNIQUE constraint failed/i);
  });

  it('should enforce unique username constraint', async () => {
    // Create first profile
    await createUserProfile(testInput);

    // Try to create another profile with same username but different email
    const duplicateUsernameInput: CreateUserProfileInput = {
      ...testInput,
      email: 'different@example.com'
    };

    await expect(createUserProfile(duplicateUsernameInput))
      .rejects
      .toThrow(/duplicate key value violates unique constraint|UNIQUE constraint failed/i);
  });

  it('should set default profile_status to active', async () => {
    const result = await createUserProfile(testInput);
    
    expect(result.profile_status).toEqual('active');
    
    // Verify in database
    const savedProfile = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, result.id))
      .execute();
    
    expect(savedProfile[0].profile_status).toEqual('active');
  });

  it('should handle profile with social media URLs', async () => {
    const socialMediaInput: CreateUserProfileInput = {
      email: 'social@example.com',
      username: 'socialuser',
      first_name: 'Social',
      last_name: 'User',
      bio: null,
      location: null,
      profile_image_url: null,
      github_url: 'https://github.com/socialuser',
      linkedin_url: 'https://linkedin.com/in/socialuser',
      portfolio_url: 'https://socialuser.dev',
      twitter_url: 'https://twitter.com/socialuser',
      years_of_experience: null,
      looking_for: null,
      availability: null
    };

    const result = await createUserProfile(socialMediaInput);

    expect(result.github_url).toEqual('https://github.com/socialuser');
    expect(result.linkedin_url).toEqual('https://linkedin.com/in/socialuser');
    expect(result.portfolio_url).toEqual('https://socialuser.dev');
    expect(result.twitter_url).toEqual('https://twitter.com/socialuser');
  });

  it('should handle developer with experience and preferences', async () => {
    const experiencedDeveloperInput: CreateUserProfileInput = {
      email: 'experienced@example.com',
      username: 'experienceddev',
      first_name: 'Experienced',
      last_name: 'Developer',
      bio: 'Senior full-stack developer with 8 years of experience',
      location: 'New York, NY',
      profile_image_url: null,
      github_url: null,
      linkedin_url: null,
      portfolio_url: null,
      twitter_url: null,
      years_of_experience: 8,
      looking_for: 'Senior developer roles and technical leadership opportunities',
      availability: 'Open to full-time opportunities'
    };

    const result = await createUserProfile(experiencedDeveloperInput);

    expect(result.years_of_experience).toEqual(8);
    expect(result.looking_for).toEqual('Senior developer roles and technical leadership opportunities');
    expect(result.availability).toEqual('Open to full-time opportunities');
    expect(result.bio).toContain('Senior full-stack developer');
  });
});