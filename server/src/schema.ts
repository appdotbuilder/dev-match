import { z } from 'zod';

// Enums for various choices
export const profileStatusEnum = z.enum(['active', 'inactive', 'banned']);
export const interactionTypeEnum = z.enum(['like', 'pass']);
export const matchStatusEnum = z.enum(['active', 'archived']);

// User profile schema
export const userProfileSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  username: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  profile_image_url: z.string().url().nullable(),
  github_url: z.string().url().nullable(),
  linkedin_url: z.string().url().nullable(),
  portfolio_url: z.string().url().nullable(),
  twitter_url: z.string().url().nullable(),
  years_of_experience: z.number().int().nullable(),
  looking_for: z.string().nullable(), // What they're looking for: collaborators, mentors, jobs, etc.
  availability: z.string().nullable(), // Available for work, side projects, etc.
  profile_status: profileStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Programming language schema
export const programmingLanguageSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type ProgrammingLanguage = z.infer<typeof programmingLanguageSchema>;

// Technology schema
export const technologySchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string().nullable(), // e.g., "frontend", "backend", "database", etc.
  created_at: z.coerce.date()
});

export type Technology = z.infer<typeof technologySchema>;

// User programming languages (many-to-many relationship)
export const userProgrammingLanguageSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  language_id: z.number(),
  proficiency_level: z.number().int().min(1).max(5), // 1-5 scale
  created_at: z.coerce.date()
});

export type UserProgrammingLanguage = z.infer<typeof userProgrammingLanguageSchema>;

// User technologies (many-to-many relationship)
export const userTechnologySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  technology_id: z.number(),
  proficiency_level: z.number().int().min(1).max(5), // 1-5 scale
  created_at: z.coerce.date()
});

export type UserTechnology = z.infer<typeof userTechnologySchema>;

// User interactions (likes/passes)
export const userInteractionSchema = z.object({
  id: z.number(),
  user_id: z.number(), // User who performed the action
  target_user_id: z.number(), // User who received the action
  interaction_type: interactionTypeEnum,
  created_at: z.coerce.date()
});

export type UserInteraction = z.infer<typeof userInteractionSchema>;

// Matches (when two users like each other)
export const matchSchema = z.object({
  id: z.number(),
  user1_id: z.number(),
  user2_id: z.number(),
  status: matchStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Match = z.infer<typeof matchSchema>;

// Chat messages
export const messageSchema = z.object({
  id: z.number(),
  match_id: z.number(),
  sender_id: z.number(),
  content: z.string(),
  created_at: z.coerce.date(),
  read_at: z.coerce.date().nullable()
});

export type Message = z.infer<typeof messageSchema>;

// Input schemas for creating/updating data
export const createUserProfileInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  bio: z.string().max(1000).nullable(),
  location: z.string().max(200).nullable(),
  profile_image_url: z.string().url().nullable(),
  github_url: z.string().url().nullable(),
  linkedin_url: z.string().url().nullable(),
  portfolio_url: z.string().url().nullable(),
  twitter_url: z.string().url().nullable(),
  years_of_experience: z.number().int().nonnegative().nullable(),
  looking_for: z.string().max(500).nullable(),
  availability: z.string().max(500).nullable()
});

export type CreateUserProfileInput = z.infer<typeof createUserProfileInputSchema>;

export const updateUserProfileInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  username: z.string().min(3).max(50).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  profile_image_url: z.string().url().nullable().optional(),
  github_url: z.string().url().nullable().optional(),
  linkedin_url: z.string().url().nullable().optional(),
  portfolio_url: z.string().url().nullable().optional(),
  twitter_url: z.string().url().nullable().optional(),
  years_of_experience: z.number().int().nonnegative().nullable().optional(),
  looking_for: z.string().max(500).nullable().optional(),
  availability: z.string().max(500).nullable().optional(),
  profile_status: profileStatusEnum.optional()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;

export const createProgrammingLanguageInputSchema = z.object({
  name: z.string().min(1).max(50)
});

export type CreateProgrammingLanguageInput = z.infer<typeof createProgrammingLanguageInputSchema>;

export const createTechnologyInputSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().max(50).nullable()
});

export type CreateTechnologyInput = z.infer<typeof createTechnologyInputSchema>;

export const addUserSkillInputSchema = z.object({
  user_id: z.number(),
  language_id: z.number().optional(),
  technology_id: z.number().optional(),
  proficiency_level: z.number().int().min(1).max(5)
}).refine(data => data.language_id !== undefined || data.technology_id !== undefined, {
  message: "Either language_id or technology_id must be provided"
});

export type AddUserSkillInput = z.infer<typeof addUserSkillInputSchema>;

export const createInteractionInputSchema = z.object({
  user_id: z.number(),
  target_user_id: z.number(),
  interaction_type: interactionTypeEnum
});

export type CreateInteractionInput = z.infer<typeof createInteractionInputSchema>;

export const sendMessageInputSchema = z.object({
  match_id: z.number(),
  sender_id: z.number(),
  content: z.string().min(1).max(2000)
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

export const getUserProfileByIdInputSchema = z.object({
  id: z.number()
});

export type GetUserProfileByIdInput = z.infer<typeof getUserProfileByIdInputSchema>;

export const getDiscoverableProfilesInputSchema = z.object({
  user_id: z.number(),
  limit: z.number().int().min(1).max(50).default(10),
  offset: z.number().int().nonnegative().default(0)
});

export type GetDiscoverableProfilesInput = z.infer<typeof getDiscoverableProfilesInputSchema>;

export const getUserMatchesInputSchema = z.object({
  user_id: z.number()
});

export type GetUserMatchesInput = z.infer<typeof getUserMatchesInputSchema>;

export const getMatchMessagesInputSchema = z.object({
  match_id: z.number(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type GetMatchMessagesInput = z.infer<typeof getMatchMessagesInputSchema>;