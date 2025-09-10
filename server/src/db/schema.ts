import { serial, text, pgTable, timestamp, integer, pgEnum, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const profileStatusEnum = pgEnum('profile_status', ['active', 'inactive', 'banned']);
export const interactionTypeEnum = pgEnum('interaction_type', ['like', 'pass']);
export const matchStatusEnum = pgEnum('match_status', ['active', 'archived']);

// User profiles table
export const userProfilesTable = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  bio: text('bio'),
  location: text('location'),
  profile_image_url: text('profile_image_url'),
  github_url: text('github_url'),
  linkedin_url: text('linkedin_url'),
  portfolio_url: text('portfolio_url'),
  twitter_url: text('twitter_url'),
  years_of_experience: integer('years_of_experience'),
  looking_for: text('looking_for'),
  availability: text('availability'),
  profile_status: profileStatusEnum('profile_status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Programming languages table
export const programmingLanguagesTable = pgTable('programming_languages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Technologies table
export const technologiesTable = pgTable('technologies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  category: text('category'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User programming languages junction table
export const userProgrammingLanguagesTable = pgTable('user_programming_languages', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => userProfilesTable.id, { onDelete: 'cascade' }),
  language_id: integer('language_id').notNull().references(() => programmingLanguagesTable.id, { onDelete: 'cascade' }),
  proficiency_level: integer('proficiency_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userLanguageUnique: unique().on(table.user_id, table.language_id),
}));

// User technologies junction table
export const userTechnologiesTable = pgTable('user_technologies', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => userProfilesTable.id, { onDelete: 'cascade' }),
  technology_id: integer('technology_id').notNull().references(() => technologiesTable.id, { onDelete: 'cascade' }),
  proficiency_level: integer('proficiency_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userTechnologyUnique: unique().on(table.user_id, table.technology_id),
}));

// User interactions table (likes/passes)
export const userInteractionsTable = pgTable('user_interactions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => userProfilesTable.id, { onDelete: 'cascade' }),
  target_user_id: integer('target_user_id').notNull().references(() => userProfilesTable.id, { onDelete: 'cascade' }),
  interaction_type: interactionTypeEnum('interaction_type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userInteractionUnique: unique().on(table.user_id, table.target_user_id),
}));

// Matches table
export const matchesTable = pgTable('matches', {
  id: serial('id').primaryKey(),
  user1_id: integer('user1_id').notNull().references(() => userProfilesTable.id, { onDelete: 'cascade' }),
  user2_id: integer('user2_id').notNull().references(() => userProfilesTable.id, { onDelete: 'cascade' }),
  status: matchStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  matchUnique: unique().on(table.user1_id, table.user2_id),
}));

// Messages table
export const messagesTable = pgTable('messages', {
  id: serial('id').primaryKey(),
  match_id: integer('match_id').notNull().references(() => matchesTable.id, { onDelete: 'cascade' }),
  sender_id: integer('sender_id').notNull().references(() => userProfilesTable.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  read_at: timestamp('read_at'),
});

// Relations
export const userProfilesRelations = relations(userProfilesTable, ({ many }) => ({
  programmingLanguages: many(userProgrammingLanguagesTable),
  technologies: many(userTechnologiesTable),
  sentInteractions: many(userInteractionsTable, { relationName: 'sentInteractions' }),
  receivedInteractions: many(userInteractionsTable, { relationName: 'receivedInteractions' }),
  matchesAsUser1: many(matchesTable, { relationName: 'matchesAsUser1' }),
  matchesAsUser2: many(matchesTable, { relationName: 'matchesAsUser2' }),
  messages: many(messagesTable),
}));

export const programmingLanguagesRelations = relations(programmingLanguagesTable, ({ many }) => ({
  users: many(userProgrammingLanguagesTable),
}));

export const technologiesRelations = relations(technologiesTable, ({ many }) => ({
  users: many(userTechnologiesTable),
}));

export const userProgrammingLanguagesRelations = relations(userProgrammingLanguagesTable, ({ one }) => ({
  user: one(userProfilesTable, {
    fields: [userProgrammingLanguagesTable.user_id],
    references: [userProfilesTable.id],
  }),
  language: one(programmingLanguagesTable, {
    fields: [userProgrammingLanguagesTable.language_id],
    references: [programmingLanguagesTable.id],
  }),
}));

export const userTechnologiesRelations = relations(userTechnologiesTable, ({ one }) => ({
  user: one(userProfilesTable, {
    fields: [userTechnologiesTable.user_id],
    references: [userProfilesTable.id],
  }),
  technology: one(technologiesTable, {
    fields: [userTechnologiesTable.technology_id],
    references: [technologiesTable.id],
  }),
}));

export const userInteractionsRelations = relations(userInteractionsTable, ({ one }) => ({
  user: one(userProfilesTable, {
    fields: [userInteractionsTable.user_id],
    references: [userProfilesTable.id],
    relationName: 'sentInteractions',
  }),
  targetUser: one(userProfilesTable, {
    fields: [userInteractionsTable.target_user_id],
    references: [userProfilesTable.id],
    relationName: 'receivedInteractions',
  }),
}));

export const matchesRelations = relations(matchesTable, ({ one, many }) => ({
  user1: one(userProfilesTable, {
    fields: [matchesTable.user1_id],
    references: [userProfilesTable.id],
    relationName: 'matchesAsUser1',
  }),
  user2: one(userProfilesTable, {
    fields: [matchesTable.user2_id],
    references: [userProfilesTable.id],
    relationName: 'matchesAsUser2',
  }),
  messages: many(messagesTable),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  match: one(matchesTable, {
    fields: [messagesTable.match_id],
    references: [matchesTable.id],
  }),
  sender: one(userProfilesTable, {
    fields: [messagesTable.sender_id],
    references: [userProfilesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type UserProfile = typeof userProfilesTable.$inferSelect;
export type NewUserProfile = typeof userProfilesTable.$inferInsert;
export type ProgrammingLanguage = typeof programmingLanguagesTable.$inferSelect;
export type NewProgrammingLanguage = typeof programmingLanguagesTable.$inferInsert;
export type Technology = typeof technologiesTable.$inferSelect;
export type NewTechnology = typeof technologiesTable.$inferInsert;
export type UserProgrammingLanguage = typeof userProgrammingLanguagesTable.$inferSelect;
export type NewUserProgrammingLanguage = typeof userProgrammingLanguagesTable.$inferInsert;
export type UserTechnology = typeof userTechnologiesTable.$inferSelect;
export type NewUserTechnology = typeof userTechnologiesTable.$inferInsert;
export type UserInteraction = typeof userInteractionsTable.$inferSelect;
export type NewUserInteraction = typeof userInteractionsTable.$inferInsert;
export type Match = typeof matchesTable.$inferSelect;
export type NewMatch = typeof matchesTable.$inferInsert;
export type Message = typeof messagesTable.$inferSelect;
export type NewMessage = typeof messagesTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  userProfiles: userProfilesTable,
  programmingLanguages: programmingLanguagesTable,
  technologies: technologiesTable,
  userProgrammingLanguages: userProgrammingLanguagesTable,
  userTechnologies: userTechnologiesTable,
  userInteractions: userInteractionsTable,
  matches: matchesTable,
  messages: messagesTable,
};