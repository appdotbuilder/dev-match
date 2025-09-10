import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  userProfilesTable, 
  userInteractionsTable,
  type NewUserProfile,
  type NewUserInteraction
} from '../db/schema';
import { type GetDiscoverableProfilesInput } from '../schema';
import { getDiscoverableProfiles } from '../handlers/get_discoverable_profiles';
import { eq } from 'drizzle-orm';

// Test user profiles
const testUser: NewUserProfile = {
  email: 'user@test.com',
  username: 'testuser',
  first_name: 'Test',
  last_name: 'User',
  bio: 'Test user bio',
  location: 'Test City',
  profile_image_url: 'https://example.com/image.jpg',
  github_url: 'https://github.com/testuser',
  linkedin_url: 'https://linkedin.com/in/testuser',
  portfolio_url: 'https://testuser.dev',
  twitter_url: 'https://twitter.com/testuser',
  years_of_experience: 5,
  looking_for: 'Collaborators',
  availability: 'Available for projects',
  profile_status: 'active'
};

const discoverableUser1: NewUserProfile = {
  email: 'discoverable1@test.com',
  username: 'discoverable1',
  first_name: 'John',
  last_name: 'Doe',
  bio: 'Full-stack developer',
  location: 'San Francisco',
  profile_image_url: 'https://example.com/john.jpg',
  github_url: 'https://github.com/johndoe',
  linkedin_url: 'https://linkedin.com/in/johndoe',
  portfolio_url: 'https://johndoe.dev',
  twitter_url: 'https://twitter.com/johndoe',
  years_of_experience: 3,
  looking_for: 'Job opportunities',
  availability: 'Open to work',
  profile_status: 'active'
};

const discoverableUser2: NewUserProfile = {
  email: 'discoverable2@test.com',
  username: 'discoverable2',
  first_name: 'Jane',
  last_name: 'Smith',
  bio: 'Frontend specialist',
  location: 'New York',
  profile_image_url: 'https://example.com/jane.jpg',
  github_url: 'https://github.com/janesmith',
  linkedin_url: 'https://linkedin.com/in/janesmith',
  portfolio_url: 'https://janesmith.dev',
  twitter_url: 'https://twitter.com/janesmith',
  years_of_experience: 7,
  looking_for: 'Side projects',
  availability: 'Weekends only',
  profile_status: 'active'
};

const inactiveUser: NewUserProfile = {
  email: 'inactive@test.com',
  username: 'inactive',
  first_name: 'Inactive',
  last_name: 'User',
  bio: 'Inactive user',
  location: 'Test City',
  profile_image_url: 'https://example.com/inactive.jpg',
  github_url: 'https://github.com/inactive',
  linkedin_url: 'https://linkedin.com/in/inactive',
  portfolio_url: 'https://inactive.dev',
  twitter_url: 'https://twitter.com/inactive',
  years_of_experience: 2,
  looking_for: 'Nothing',
  availability: 'Not available',
  profile_status: 'inactive'
};

// Test input with defaults applied
const testInput: GetDiscoverableProfilesInput = {
  user_id: 1,
  limit: 10,
  offset: 0
};

describe('getDiscoverableProfiles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return discoverable profiles excluding own profile', async () => {
    // Create test user and discoverable users
    const users = await db.insert(userProfilesTable)
      .values([testUser, discoverableUser1, discoverableUser2, inactiveUser])
      .returning()
      .execute();

    const currentUserId = users[0].id;
    const input = { ...testInput, user_id: currentUserId };

    const result = await getDiscoverableProfiles(input);

    // Should return 2 active profiles (excluding own profile and inactive profile)
    expect(result).toHaveLength(2);
    
    // Should not include own profile
    const userIds = result.map(profile => profile.id);
    expect(userIds).not.toContain(currentUserId);
    
    // Should only include active profiles
    result.forEach(profile => {
      expect(profile.profile_status).toEqual('active');
    });
    
    // Verify profile data
    const johnProfile = result.find(p => p.username === 'discoverable1');
    expect(johnProfile).toBeDefined();
    expect(johnProfile!.first_name).toEqual('John');
    expect(johnProfile!.last_name).toEqual('Doe');
    expect(johnProfile!.years_of_experience).toEqual(3);
    
    const janeProfile = result.find(p => p.username === 'discoverable2');
    expect(janeProfile).toBeDefined();
    expect(janeProfile!.first_name).toEqual('Jane');
    expect(janeProfile!.last_name).toEqual('Smith');
    expect(janeProfile!.years_of_experience).toEqual(7);
  });

  it('should exclude profiles that user has already interacted with', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([testUser, discoverableUser1, discoverableUser2])
      .returning()
      .execute();

    const currentUserId = users[0].id;
    const interactedUserId = users[1].id;
    const notInteractedUserId = users[2].id;

    // Create interaction (user liked discoverable1)
    const interaction: NewUserInteraction = {
      user_id: currentUserId,
      target_user_id: interactedUserId,
      interaction_type: 'like'
    };

    await db.insert(userInteractionsTable)
      .values(interaction)
      .execute();

    const input = { ...testInput, user_id: currentUserId };
    const result = await getDiscoverableProfiles(input);

    // Should only return the user that hasn't been interacted with
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(notInteractedUserId);
    expect(result[0].username).toEqual('discoverable2');
  });

  it('should respect limit and offset parameters', async () => {
    // Create multiple discoverable users
    const users = [testUser];
    for (let i = 1; i <= 5; i++) {
      users.push({
        ...discoverableUser1,
        email: `user${i}@test.com`,
        username: `user${i}`,
        first_name: `User${i}`
      });
    }

    const createdUsers = await db.insert(userProfilesTable)
      .values(users)
      .returning()
      .execute();

    const currentUserId = createdUsers[0].id;

    // Test limit
    const limitedResult = await getDiscoverableProfiles({
      user_id: currentUserId,
      limit: 2,
      offset: 0
    });

    expect(limitedResult).toHaveLength(2);

    // Test offset
    const offsetResult = await getDiscoverableProfiles({
      user_id: currentUserId,
      limit: 2,
      offset: 2
    });

    expect(offsetResult).toHaveLength(2);
    
    // Results should be different (no overlap)
    const limitedIds = limitedResult.map(p => p.id);
    const offsetIds = offsetResult.map(p => p.id);
    const intersection = limitedIds.filter(id => offsetIds.includes(id));
    expect(intersection).toHaveLength(0);
  });

  it('should return profiles ordered by created_at descending', async () => {
    // Create users with different creation times
    const user1 = await db.insert(userProfilesTable)
      .values(testUser)
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const user2 = await db.insert(userProfilesTable)
      .values(discoverableUser1)
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const user3 = await db.insert(userProfilesTable)
      .values(discoverableUser2)
      .returning()
      .execute();

    const currentUserId = user1[0].id;
    const input = { ...testInput, user_id: currentUserId };

    const result = await getDiscoverableProfiles(input);

    // Should return newest first
    expect(result).toHaveLength(2);
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle empty result when all profiles are filtered out', async () => {
    // Create only the current user
    const users = await db.insert(userProfilesTable)
      .values([testUser])
      .returning()
      .execute();

    const currentUserId = users[0].id;
    const input = { ...testInput, user_id: currentUserId };

    const result = await getDiscoverableProfiles(input);

    expect(result).toHaveLength(0);
  });

  it('should handle user with no interactions', async () => {
    // Create users without any interactions
    const users = await db.insert(userProfilesTable)
      .values([testUser, discoverableUser1])
      .returning()
      .execute();

    const currentUserId = users[0].id;
    const input = { ...testInput, user_id: currentUserId };

    const result = await getDiscoverableProfiles(input);

    expect(result).toHaveLength(1);
    expect(result[0].username).toEqual('discoverable1');
  });

  it('should verify profile data integrity', async () => {
    // Create test users
    const users = await db.insert(userProfilesTable)
      .values([testUser, discoverableUser1])
      .returning()
      .execute();

    const currentUserId = users[0].id;
    const input = { ...testInput, user_id: currentUserId };

    const result = await getDiscoverableProfiles(input);

    expect(result).toHaveLength(1);
    
    const profile = result[0];
    
    // Verify all fields are present and correct
    expect(profile.id).toBeDefined();
    expect(typeof profile.id).toBe('number');
    expect(profile.email).toEqual('discoverable1@test.com');
    expect(profile.username).toEqual('discoverable1');
    expect(profile.first_name).toEqual('John');
    expect(profile.last_name).toEqual('Doe');
    expect(profile.bio).toEqual('Full-stack developer');
    expect(profile.location).toEqual('San Francisco');
    expect(profile.profile_image_url).toEqual('https://example.com/john.jpg');
    expect(profile.github_url).toEqual('https://github.com/johndoe');
    expect(profile.linkedin_url).toEqual('https://linkedin.com/in/johndoe');
    expect(profile.portfolio_url).toEqual('https://johndoe.dev');
    expect(profile.twitter_url).toEqual('https://twitter.com/johndoe');
    expect(profile.years_of_experience).toEqual(3);
    expect(profile.looking_for).toEqual('Job opportunities');
    expect(profile.availability).toEqual('Open to work');
    expect(profile.profile_status).toEqual('active');
    expect(profile.created_at).toBeInstanceOf(Date);
    expect(profile.updated_at).toBeInstanceOf(Date);
  });
});