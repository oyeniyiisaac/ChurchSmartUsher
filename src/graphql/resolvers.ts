import type { GraphQLContext } from "./context";

export const resolvers = {
  Query: {
    ping: (_parent: unknown, _args: unknown, _context: GraphQLContext) => ({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
    }),
  },
};
