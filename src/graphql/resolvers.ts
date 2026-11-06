import type { AuthenticatedMember } from "@/auth/session";
import {
  type AuthPayload,
  loginMember,
  logoutMember,
  registerMember,
  requireRole,
} from "@/services/auth";
import {
  type ActivityInfo,
  assignMemberAffiliations,
  createActivity,
  createDepartment,
  type DepartmentInfo,
  getMyProfile,
  listActivities,
  listDepartments,
  listMembers,
  type MembersFilterInput,
  updateMyProfile,
} from "@/services/profile";
import type {
  ActivityInput,
  AssignAffiliationsInput,
  DepartmentInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "@/services/validation";
import type { GraphQLContext } from "./context";

export const resolvers = {
  Member: {
    status: (parent: AuthenticatedMember): string => parent.status ?? "ACTIVE",
    gender: (parent: AuthenticatedMember): string => parent.gender ?? "Male",
    departmentIds: (parent: AuthenticatedMember): string[] => parent.departmentIds ?? [],
    activityIds: (parent: AuthenticatedMember): string[] => parent.activityIds ?? [],
    consentGivenAt: (parent: AuthenticatedMember): string =>
      parent.consentGivenAt ?? new Date().toISOString(),
  },

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

    myProfile: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<AuthenticatedMember> => {
      const authenticated = requireRole(context.member ?? null, ["MEMBER", "USHER", "ADMIN"]);
      try {
        return await getMyProfile(authenticated.id);
      } catch {
        return authenticated;
      }
    },

    departments: async (): Promise<DepartmentInfo[]> => {
      return listDepartments();
    },

    activities: async (): Promise<ActivityInfo[]> => {
      return listActivities();
    },

    members: async (
      _parent: unknown,
      args: { filter?: MembersFilterInput },
      context: GraphQLContext,
    ): Promise<AuthenticatedMember[]> => {
      requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return listMembers(args.filter);
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

    updateMyProfile: async (
      _parent: unknown,
      args: { input: UpdateProfileInput },
      context: GraphQLContext,
    ): Promise<AuthenticatedMember> => {
      const authenticated = requireRole(context.member ?? null, ["MEMBER", "USHER", "ADMIN"]);
      return updateMyProfile(authenticated.id, args.input);
    },

    createDepartment: async (
      _parent: unknown,
      args: { input: DepartmentInput },
      context: GraphQLContext,
    ): Promise<DepartmentInfo> => {
      requireRole(context.member ?? null, ["ADMIN"]);
      return createDepartment(args.input);
    },

    createActivity: async (
      _parent: unknown,
      args: { input: ActivityInput },
      context: GraphQLContext,
    ): Promise<ActivityInfo> => {
      requireRole(context.member ?? null, ["ADMIN"]);
      return createActivity(args.input);
    },

    assignMemberAffiliations: async (
      _parent: unknown,
      args: { input: AssignAffiliationsInput },
      context: GraphQLContext,
    ): Promise<AuthenticatedMember> => {
      requireRole(context.member ?? null, ["ADMIN"]);
      return assignMemberAffiliations(args.input);
    },
  },
};
