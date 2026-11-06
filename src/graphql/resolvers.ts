import type { AuthenticatedMember } from "@/auth/session";
import {
  type AttendanceRecordInfo,
  getServiceAttendance,
  markManualPresent,
  markPresent,
  type MarkPresentResult,
  registerGuestAttendance,
  type ServiceAttendanceSummary,
  undoAttendance,
} from "@/services/attendance";
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
import {
  type CheckinPreviewPayload,
  closeService,
  createService,
  getActiveService,
  getCheckinPreview,
  getServiceQr,
  listServices,
  openService,
  type ServiceInfo,
  type ServiceQrPayload,
} from "@/services/service";
import {
  type AttendanceReportsSummary,
  exportServiceAttendanceCsv,
  getAttendanceReports,
  getMyStreakSummary,
  type StreakSummary,
} from "@/services/streak";
import type { ServiceType } from "@/db/models";
import type {
  ActivityInput,
  AssignAffiliationsInput,
  CreateServiceInput,
  DepartmentInput,
  LoginInput,
  RegisterGuestInput,
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

    myStreak: async (
      _parent: unknown,
      args: { serviceType?: ServiceType },
      context: GraphQLContext,
    ): Promise<StreakSummary> => {
      const authenticated = requireRole(context.member ?? null, ["MEMBER", "USHER", "ADMIN"]);
      return getMyStreakSummary(authenticated, args.serviceType ?? "SUNDAY");
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

    services: async (): Promise<ServiceInfo[]> => {
      return listServices();
    },

    activeService: async (): Promise<ServiceInfo> => {
      return getActiveService();
    },

    serviceQr: async (
      _parent: unknown,
      args: { serviceId: string },
      context: GraphQLContext,
    ): Promise<ServiceQrPayload> => {
      requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return getServiceQr(args.serviceId);
    },

    checkinPreview: async (
      _parent: unknown,
      args: { serviceId: string; token: string },
      context: GraphQLContext,
    ): Promise<CheckinPreviewPayload> => {
      return getCheckinPreview(args.serviceId, args.token, context.member ?? null);
    },

    serviceAttendance: async (
      _parent: unknown,
      args: { serviceId: string },
      context: GraphQLContext,
    ): Promise<ServiceAttendanceSummary> => {
      requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return getServiceAttendance(args.serviceId);
    },

    attendanceReports: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<AttendanceReportsSummary> => {
      requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return getAttendanceReports();
    },

    exportAttendanceCsv: async (
      _parent: unknown,
      args: { serviceId?: string },
      context: GraphQLContext,
    ): Promise<string> => {
      requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return exportServiceAttendanceCsv(args.serviceId);
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

    createService: async (
      _parent: unknown,
      args: { input: CreateServiceInput },
      context: GraphQLContext,
    ): Promise<ServiceInfo> => {
      requireRole(context.member ?? null, ["ADMIN"]);
      return createService(args.input);
    },

    openService: async (
      _parent: unknown,
      args: { serviceId: string },
      context: GraphQLContext,
    ): Promise<ServiceInfo> => {
      requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return openService(args.serviceId);
    },

    closeService: async (
      _parent: unknown,
      args: { serviceId: string },
      context: GraphQLContext,
    ): Promise<ServiceInfo> => {
      requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return closeService(args.serviceId);
    },

    markPresent: async (
      _parent: unknown,
      args: { serviceId: string; token: string },
      context: GraphQLContext,
    ): Promise<MarkPresentResult> => {
      const authenticated = requireRole(context.member ?? null, ["MEMBER", "USHER", "ADMIN"]);
      return markPresent(authenticated, args);
    },

    markManualPresent: async (
      _parent: unknown,
      args: { serviceId: string; memberId: string; station?: string },
      context: GraphQLContext,
    ): Promise<MarkPresentResult> => {
      const usher = requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return markManualPresent(usher, args);
    },

    registerGuestAttendance: async (
      _parent: unknown,
      args: { input: RegisterGuestInput },
      context: GraphQLContext,
    ): Promise<AttendanceRecordInfo> => {
      const usher = requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return registerGuestAttendance(usher, args.input);
    },

    undoAttendance: async (
      _parent: unknown,
      args: { attendanceId: string },
      context: GraphQLContext,
    ): Promise<boolean> => {
      requireRole(context.member ?? null, ["USHER", "ADMIN"]);
      return undoAttendance(args.attendanceId);
    },
  },
};
