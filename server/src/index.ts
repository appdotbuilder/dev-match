import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createUserProfileInputSchema,
  updateUserProfileInputSchema,
  getUserProfileByIdInputSchema,
  getDiscoverableProfilesInputSchema,
  createProgrammingLanguageInputSchema,
  createTechnologyInputSchema,
  addUserSkillInputSchema,
  createInteractionInputSchema,
  getUserMatchesInputSchema,
  sendMessageInputSchema,
  getMatchMessagesInputSchema
} from './schema';

// Import handlers
import { createUserProfile } from './handlers/create_user_profile';
import { getUserProfile } from './handlers/get_user_profile';
import { updateUserProfile } from './handlers/update_user_profile';
import { getDiscoverableProfiles } from './handlers/get_discoverable_profiles';
import { createProgrammingLanguage } from './handlers/create_programming_language';
import { getProgrammingLanguages } from './handlers/get_programming_languages';
import { createTechnology } from './handlers/create_technology';
import { getTechnologies } from './handlers/get_technologies';
import { addUserSkill } from './handlers/add_user_skill';
import { createInteraction } from './handlers/create_interaction';
import { getUserMatches } from './handlers/get_user_matches';
import { sendMessage } from './handlers/send_message';
import { getMatchMessages } from './handlers/get_match_messages';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User profile management
  createUserProfile: publicProcedure
    .input(createUserProfileInputSchema)
    .mutation(({ input }) => createUserProfile(input)),

  getUserProfile: publicProcedure
    .input(getUserProfileByIdInputSchema)
    .query(({ input }) => getUserProfile(input)),

  updateUserProfile: publicProcedure
    .input(updateUserProfileInputSchema)
    .mutation(({ input }) => updateUserProfile(input)),

  // Profile discovery
  getDiscoverableProfiles: publicProcedure
    .input(getDiscoverableProfilesInputSchema)
    .query(({ input }) => getDiscoverableProfiles(input)),

  // Programming languages management
  createProgrammingLanguage: publicProcedure
    .input(createProgrammingLanguageInputSchema)
    .mutation(({ input }) => createProgrammingLanguage(input)),

  getProgrammingLanguages: publicProcedure
    .query(() => getProgrammingLanguages()),

  // Technologies management
  createTechnology: publicProcedure
    .input(createTechnologyInputSchema)
    .mutation(({ input }) => createTechnology(input)),

  getTechnologies: publicProcedure
    .query(() => getTechnologies()),

  // User skills management
  addUserSkill: publicProcedure
    .input(addUserSkillInputSchema)
    .mutation(({ input }) => addUserSkill(input)),

  // User interactions and matching
  createInteraction: publicProcedure
    .input(createInteractionInputSchema)
    .mutation(({ input }) => createInteraction(input)),

  getUserMatches: publicProcedure
    .input(getUserMatchesInputSchema)
    .query(({ input }) => getUserMatches(input)),

  // Messaging
  sendMessage: publicProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input }) => sendMessage(input)),

  getMatchMessages: publicProcedure
    .input(getMatchMessagesInputSchema)
    .query(({ input }) => getMatchMessages(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();