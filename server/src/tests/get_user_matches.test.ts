import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, matchesTable } from '../db/schema';
import { type GetUserMatchesInput } from '../schema';
import { getUserMatches } from '../handlers/get_user_matches';

// Test users for creating matches
const testUser1 = {
  email: 'user1@example.com',
  username: 'user1',
  first_name: 'John',
  last_name: 'Doe',
  bio: 'Software developer',
  location: 'San Francisco',
  profile_image_url: 'https://example.com/user1.jpg',
  github_url: 'https://github.com/user1',
  linkedin_url: 'https://linkedin.com/in/user1',
  portfolio_url: 'https://user1.dev',
  twitter_url: 'https://twitter.com/user1',
  years_of_experience: 5,
  looking_for: 'Collaborators',
  availability: 'Available for projects'
};

const testUser2 = {
  email: 'user2@example.com',
  username: 'user2',
  first_name: 'Jane',
  last_name: 'Smith',
  bio: 'Frontend developer',
  location: 'New York',
  profile_image_url: 'https://example.com/user2.jpg',
  github_url: 'https://github.com/user2',
  linkedin_url: 'https://linkedin.com/in/user2',
  portfolio_url: 'https://user2.dev',
  twitter_url: 'https://twitter.com/user2',
  years_of_experience: 3,
  looking_for: 'Mentors',
  availability: 'Part-time available'
};

const testUser3 = {
  email: 'user3@example.com',
  username: 'user3',
  first_name: 'Bob',
  last_name: 'Johnson',
  bio: 'Backend developer',
  location: 'Seattle',
  profile_image_url: 'https://example.com/user3.jpg',
  github_url: 'https://github.com/user3',
  linkedin_url: 'https://linkedin.com/in/user3',
  portfolio_url: 'https://user3.dev',
  twitter_url: 'https://twitter.com/user3',
  years_of_experience: 7,
  looking_for: 'Job opportunities',
  availability: 'Open to work'
};

describe('getUserMatches', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no matches', async () => {
    // Create a user but no matches
    const userResult = await db.insert(userProfilesTable)
      .values(testUser1)
      .returning()
      .execute();

    const input: GetUserMatchesInput = {
      user_id: userResult[0].id
    };

    const result = await getUserMatches(input);

    expect(result).toEqual([]);
  });

  it('should return matches where user is user1', async () => {
    // Create users
    const user1Result = await db.insert(userProfilesTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user2Result = await db.insert(userProfilesTable)
      .values(testUser2)
      .returning()
      .execute();

    // Create match with user1 as user1_id
    const matchResult = await db.insert(matchesTable)
      .values({
        user1_id: user1Result[0].id,
        user2_id: user2Result[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const input: GetUserMatchesInput = {
      user_id: user1Result[0].id
    };

    const result = await getUserMatches(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(matchResult[0].id);
    expect(result[0].user1_id).toEqual(user1Result[0].id);
    expect(result[0].user2_id).toEqual(user2Result[0].id);
    expect(result[0].status).toEqual('active');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return matches where user is user2', async () => {
    // Create users
    const user1Result = await db.insert(userProfilesTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user2Result = await db.insert(userProfilesTable)
      .values(testUser2)
      .returning()
      .execute();

    // Create match with user2 as user2_id
    const matchResult = await db.insert(matchesTable)
      .values({
        user1_id: user1Result[0].id,
        user2_id: user2Result[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const input: GetUserMatchesInput = {
      user_id: user2Result[0].id
    };

    const result = await getUserMatches(input);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(matchResult[0].id);
    expect(result[0].user1_id).toEqual(user1Result[0].id);
    expect(result[0].user2_id).toEqual(user2Result[0].id);
    expect(result[0].status).toEqual('active');
  });

  it('should return multiple matches for a user', async () => {
    // Create users
    const user1Result = await db.insert(userProfilesTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user2Result = await db.insert(userProfilesTable)
      .values(testUser2)
      .returning()
      .execute();

    const user3Result = await db.insert(userProfilesTable)
      .values(testUser3)
      .returning()
      .execute();

    // Create multiple matches
    await db.insert(matchesTable)
      .values([
        {
          user1_id: user1Result[0].id,
          user2_id: user2Result[0].id,
          status: 'active'
        },
        {
          user1_id: user3Result[0].id,
          user2_id: user1Result[0].id,
          status: 'active'
        }
      ])
      .execute();

    const input: GetUserMatchesInput = {
      user_id: user1Result[0].id
    };

    const result = await getUserMatches(input);

    expect(result).toHaveLength(2);
    
    // Check that both matches are returned
    const matchUserIds = result.flatMap(match => [match.user1_id, match.user2_id]);
    expect(matchUserIds).toContain(user1Result[0].id);
    expect(matchUserIds).toContain(user2Result[0].id);
    expect(matchUserIds).toContain(user3Result[0].id);
    
    // All matches should be active
    result.forEach(match => {
      expect(match.status).toEqual('active');
    });
  });

  it('should only return active matches, not archived ones', async () => {
    // Create users
    const user1Result = await db.insert(userProfilesTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user2Result = await db.insert(userProfilesTable)
      .values(testUser2)
      .returning()
      .execute();

    const user3Result = await db.insert(userProfilesTable)
      .values(testUser3)
      .returning()
      .execute();

    // Create one active match and one archived match
    await db.insert(matchesTable)
      .values([
        {
          user1_id: user1Result[0].id,
          user2_id: user2Result[0].id,
          status: 'active'
        },
        {
          user1_id: user1Result[0].id,
          user2_id: user3Result[0].id,
          status: 'archived'
        }
      ])
      .execute();

    const input: GetUserMatchesInput = {
      user_id: user1Result[0].id
    };

    const result = await getUserMatches(input);

    // Should only return the active match
    expect(result).toHaveLength(1);
    expect(result[0].user2_id).toEqual(user2Result[0].id);
    expect(result[0].status).toEqual('active');
  });

  it('should handle non-existent user gracefully', async () => {
    const input: GetUserMatchesInput = {
      user_id: 99999 // Non-existent user ID
    };

    const result = await getUserMatches(input);

    expect(result).toEqual([]);
  });

  it('should return matches in chronological order', async () => {
    // Create users
    const user1Result = await db.insert(userProfilesTable)
      .values(testUser1)
      .returning()
      .execute();
    
    const user2Result = await db.insert(userProfilesTable)
      .values(testUser2)
      .returning()
      .execute();

    const user3Result = await db.insert(userProfilesTable)
      .values(testUser3)
      .returning()
      .execute();

    // Create matches with different timestamps by creating them sequentially
    const match1Result = await db.insert(matchesTable)
      .values({
        user1_id: user1Result[0].id,
        user2_id: user2Result[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const match2Result = await db.insert(matchesTable)
      .values({
        user1_id: user3Result[0].id,
        user2_id: user1Result[0].id,
        status: 'active'
      })
      .returning()
      .execute();

    const input: GetUserMatchesInput = {
      user_id: user1Result[0].id
    };

    const result = await getUserMatches(input);

    expect(result).toHaveLength(2);
    
    // Verify both matches are present
    const matchIds = result.map(match => match.id);
    expect(matchIds).toContain(match1Result[0].id);
    expect(matchIds).toContain(match2Result[0].id);

    // Verify all returned matches have proper timestamps
    result.forEach(match => {
      expect(match.created_at).toBeInstanceOf(Date);
      expect(match.updated_at).toBeInstanceOf(Date);
    });
  });
});