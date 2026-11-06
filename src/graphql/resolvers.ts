import type { AuthenticatedMember } from "@/auth/session";
import {
  type AuthPayload,
  loginMember,
  logoutMember,
  registerMember,
  requireRole,
} from "@/services/auth";
import type { LoginInput, RegisterInput } from "@/services/validation";
import type { GraphQLContext } from "./context";

export const resolvers = {
  Query: {
    ping: (
      _parent: unknown,
      _args: unknown,
      _context: GraphQLContext,
    ): { status: string; timestamp: string; version: string } => ({
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
    }),

    me: (_parent: unknown, _args: unknown, context: GraphQLContext): AuthenticatedMember | null => {
      return context.member ?? null;
    },

    adminOnlyCheck: (_parent: unknown, _args: unknown, context: GraphQLContext): string => {
      const admin = requireRole(context.member ?? null, ["ADMIN"]);
      return `Authorized admin access confirmed for ${admin.fullName}`;
    },
  },

  Mutation: {
    register: async (
      _parent: unknown,
      args: { input: RegisterInput },
      _context: GraphQLContext,
    ): Promise<AuthPayload> => {
      return registerMember(args.input);
    },

    login: async (
      _parent: unknown,
      args: { input: LoginInput },
      _context: GraphQLContext,
    ): Promise<AuthPayload> => {
      return loginMember(args.input);
    },

    logout: async (
      _parent: unknown,
      _args: unknown,
      _context: GraphQLContext,
    ): Promise<boolean> => {
      return logoutMember();
    },
  },
};
