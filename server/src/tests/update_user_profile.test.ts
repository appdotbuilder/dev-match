import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable } from '../db/schema';
import { type UpdateUserProfileInput } from '../schema';
import { updateUserProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

// Helper function to create a test user profile
const createTestUser = async () => {
  const result = await db.insert(userProfilesTable)
    .values({
      email: 'test@example.com',
      username: 'testuser',
      first_name: 'Test',
      last_name: 'User',
      bio: 'Original bio',
      location: 'Original City',
      years_of_experience: 5,
      looking_for: 'Original goals',
      availability: 'Original availability',
      profile_status: 'active'
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user profile with all fields', async () => {
    const testUser = await createTestUser();
    
    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      email: 'updated@example.com',
      username: 'updateduser',
      first_name: 'Updated',
      last_name: 'User',
      bio: 'Updated bio',
      location: 'Updated City',
      profile_image_url: 'https://example.com/updated-image.jpg',
      github_url: 'https://github.com/updateduser',
      linkedin_url: 'https://linkedin.com/in/updateduser',
      portfolio_url: 'https://updateduser.dev',
      twitter_url: 'https://twitter.com/updateduser',
      years_of_experience: 7,
      looking_for: 'Updated goals',
      availability: 'Updated availability',
      profile_status: 'inactive'
    };

    const result = await updateUserProfile(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(testUser.id);
    expect(result.email).toEqual('updated@example.com');
    expect(result.username).toEqual('updateduser');
    expect(result.first_name).toEqual('Updated');
    expect(result.last_name).toEqual('User');
    expect(result.bio).toEqual('Updated bio');
    expect(result.location).toEqual('Updated City');
    expect(result.profile_image_url).toEqual('https://example.com/updated-image.jpg');
    expect(result.github_url).toEqual('https://github.com/updateduser');
    expect(result.linkedin_url).toEqual('https://linkedin.com/in/updateduser');
    expect(result.portfolio_url).toEqual('https://updateduser.dev');
    expect(result.twitter_url).toEqual('https://twitter.com/updateduser');
    expect(result.years_of_experience).toEqual(7);
    expect(result.looking_for).toEqual('Updated goals');
    expect(result.availability).toEqual('Updated availability');
    expect(result.profile_status).toEqual('inactive');
    expect(result.created_at).toEqual(testUser.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testUser.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    const testUser = await createTestUser();
    const originalUpdatedAt = testUser.updated_at;
    
    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      first_name: 'Partially Updated',
      bio: 'Partially updated bio'
    };

    const result = await updateUserProfile(updateInput);

    // Verify only specified fields were updated
    expect(result.first_name).toEqual('Partially Updated');
    expect(result.bio).toEqual('Partially updated bio');
    
    // Verify other fields remained unchanged
    expect(result.email).toEqual(testUser.email);
    expect(result.username).toEqual(testUser.username);
    expect(result.last_name).toEqual(testUser.last_name);
    expect(result.location).toEqual(testUser.location);
    expect(result.years_of_experience).toEqual(testUser.years_of_experience);
    expect(result.profile_status).toEqual(testUser.profile_status);
    
    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should update nullable fields to null', async () => {
    const testUser = await createTestUser();
    
    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      bio: null,
      location: null,
      years_of_experience: null,
      looking_for: null,
      availability: null
    };

    const result = await updateUserProfile(updateInput);

    expect(result.bio).toBeNull();
    expect(result.location).toBeNull();
    expect(result.years_of_experience).toBeNull();
    expect(result.looking_for).toBeNull();
    expect(result.availability).toBeNull();
  });

  it('should persist changes to database', async () => {
    const testUser = await createTestUser();
    
    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      first_name: 'Database Test',
      email: 'dbtest@example.com'
    };

    await updateUserProfile(updateInput);

    // Verify changes were persisted in database
    const dbUser = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, testUser.id))
      .execute();

    expect(dbUser).toHaveLength(1);
    expect(dbUser[0].first_name).toEqual('Database Test');
    expect(dbUser[0].email).toEqual('dbtest@example.com');
  });

  it('should throw error for non-existent user', async () => {
    const updateInput: UpdateUserProfileInput = {
      id: 99999, // Non-existent ID
      first_name: 'Should Fail'
    };

    await expect(updateUserProfile(updateInput)).rejects.toThrow(/User profile with id 99999 not found/i);
  });

  it('should handle unique constraint violations', async () => {
    // Create two users
    const user1 = await createTestUser();
    const user2 = await db.insert(userProfilesTable)
      .values({
        email: 'user2@example.com',
        username: 'user2',
        first_name: 'User',
        last_name: 'Two'
      })
      .returning()
      .execute();

    // Try to update user2 with user1's email
    const updateInput: UpdateUserProfileInput = {
      id: user2[0].id,
      email: user1.email // This should violate unique constraint
    };

    await expect(updateUserProfile(updateInput)).rejects.toThrow();
  });

  it('should handle profile status updates', async () => {
    const testUser = await createTestUser();
    
    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      profile_status: 'banned'
    };

    const result = await updateUserProfile(updateInput);

    expect(result.profile_status).toEqual('banned');
    
    // Verify in database
    const dbUser = await db.select()
      .from(userProfilesTable)
      .where(eq(userProfilesTable.id, testUser.id))
      .execute();

    expect(dbUser[0].profile_status).toEqual('banned');
  });

  it('should handle URL field updates', async () => {
    const testUser = await createTestUser();
    
    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      profile_image_url: 'https://newimage.com/pic.jpg',
      github_url: 'https://github.com/newuser',
      linkedin_url: 'https://linkedin.com/in/newuser',
      portfolio_url: 'https://newuser.dev',
      twitter_url: 'https://twitter.com/newuser'
    };

    const result = await updateUserProfile(updateInput);

    expect(result.profile_image_url).toEqual('https://newimage.com/pic.jpg');
    expect(result.github_url).toEqual('https://github.com/newuser');
    expect(result.linkedin_url).toEqual('https://linkedin.com/in/newuser');
    expect(result.portfolio_url).toEqual('https://newuser.dev');
    expect(result.twitter_url).toEqual('https://twitter.com/newuser');
  });

  it('should preserve original created_at timestamp', async () => {
    const testUser = await createTestUser();
    const originalCreatedAt = testUser.created_at;
    
    const updateInput: UpdateUserProfileInput = {
      id: testUser.id,
      first_name: 'Timestamp Test'
    };

    const result = await updateUserProfile(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
  });
});