import type { AuthenticatedMember } from "@/auth/session";
import {
  type AttendanceRecordInfo,
  getMyAttendanceHistory,
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
  requireAdminAccess,
  requirePhotoUploadAccess,
  requireRole,
  requireUsherOrAdminAccess,
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
  updateMemberRole,
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
import {
  type AdminPhotoHubOverview,
  getPhotoById,
  listActivePhotos,
  listAdminPhotos,
  moderateServicePhoto,
  purgeExpiredPhotos,
  type PurgePhotosResult,
  type ServicePhotoRecord,
  type UploadServicePhotoInput,
  uploadServicePhoto,
} from "@/services/photo";
import {
  type GeofenceCheckResult,
  getParishSettings,
  type ParishSettingsRecord,
  type UpdateParishSettingsInput,
  updateParishSettings,
  verifySanctuaryGeofence,
} from "@/services/settings";
import {
  type CheckinCodeDispatchResult,
  requestCheckinCode,
  verifyCheckinCode,
} from "@/services/checkin-code";
import type { ServiceType, UserRole } from "@/db/models";
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
    avatarUrl: (parent: AuthenticatedMember): string => parent.avatarUrl ?? "",
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

    myAttendanceHistory: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<AttendanceRecordInfo[]> => {
      if (!context.member) {
        return [];
      }
      return getMyAttendanceHistory(context.member.id);
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
      requireUsherOrAdminAccess(context.member ?? null);
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
      requireUsherOrAdminAccess(context.member ?? null);
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
      requireUsherOrAdminAccess(context.member ?? null);
      return getServiceAttendance(args.serviceId);
    },

    attendanceReports: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<AttendanceReportsSummary> => {
      requireAdminAccess(context.member ?? null);
      return getAttendanceReports();
    },

    exportAttendanceCsv: async (
      _parent: unknown,
      args: { serviceId?: string },
      context: GraphQLContext,
    ): Promise<string> => {
      requireAdminAccess(context.member ?? null);
      return exportServiceAttendanceCsv(args.serviceId);
    },

    servicePhotos: async (
      _parent: unknown,
      args: { albumKey?: string },
      _context: GraphQLContext,
    ): Promise<ServicePhotoRecord[]> => {
      return listActivePhotos({ albumKey: args.albumKey });
    },

    servicePhoto: async (
      _parent: unknown,
      args: { id: string },
      _context: GraphQLContext,
    ): Promise<ServicePhotoRecord | null> => {
      return getPhotoById(args.id);
    },

    adminPhotoHub: async (
      _parent: unknown,
      args: { statusFilter?: string; tagFilter?: string },
      context: GraphQLContext,
    ): Promise<AdminPhotoHubOverview> => {
      requirePhotoUploadAccess(context.member ?? null);
      return listAdminPhotos({
        statusFilter: args.statusFilter,
        tagFilter: args.tagFilter,
      });
    },

    parishSettings: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<ParishSettingsRecord> => {
      requireAdminAccess(context.member ?? null);
      return getParishSettings();
    },

    verifyGeofence: async (
      _parent: unknown,
      args: { latitude: number; longitude: number },
      context: GraphQLContext,
    ): Promise<GeofenceCheckResult> => {
      requireRole(context.member ?? null, ["MEMBER", "USHER", "ADMIN"]);
      return verifySanctuaryGeofence(args);
    },

    adminOnlyCheck: (_parent: unknown, _args: unknown, context: GraphQLContext): string => {
      const admin = requireAdminAccess(context.member ?? null);
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

    updateMemberRole: async (
      _parent: unknown,
      args: { memberId: string; role: UserRole },
      context: GraphQLContext,
    ): Promise<AuthenticatedMember> => {
      requireRole(context.member ?? null, ["ADMIN"]);
      return updateMemberRole(args.memberId, args.role);
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
      requireUsherOrAdminAccess(context.member ?? null);
      return createService(args.input);
    },

    openService: async (
      _parent: unknown,
      args: { serviceId: string },
      context: GraphQLContext,
    ): Promise<ServiceInfo> => {
      requireUsherOrAdminAccess(context.member ?? null);
      return openService(args.serviceId);
    },

    closeService: async (
      _parent: unknown,
      args: { serviceId: string },
      context: GraphQLContext,
    ): Promise<ServiceInfo> => {
      requireUsherOrAdminAccess(context.member ?? null);
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
      const usher = requireUsherOrAdminAccess(context.member ?? null);
      return markManualPresent(usher, args);
    },

    registerGuestAttendance: async (
      _parent: unknown,
      args: { input: RegisterGuestInput },
      context: GraphQLContext,
    ): Promise<AttendanceRecordInfo> => {
      const usher = requireUsherOrAdminAccess(context.member ?? null);
      return registerGuestAttendance(usher, args.input);
    },

    undoAttendance: async (
      _parent: unknown,
      args: { attendanceId: string },
      context: GraphQLContext,
    ): Promise<boolean> => {
      requireUsherOrAdminAccess(context.member ?? null);
      return undoAttendance(args.attendanceId);
    },

    uploadServicePhoto: async (
      _parent: unknown,
      args: { input: UploadServicePhotoInput },
      context: GraphQLContext,
    ): Promise<ServicePhotoRecord> => {
      requirePhotoUploadAccess(context.member ?? null);
      return uploadServicePhoto(args.input);
    },

    moderateServicePhoto: async (
      _parent: unknown,
      args: {
        photoId: string;
        action: "PUBLISH" | "APPROVE" | "BLUR_MINORS" | "REJECT" | "DELETE";
      },
      context: GraphQLContext,
    ): Promise<ServicePhotoRecord> => {
      requirePhotoUploadAccess(context.member ?? null);
      return moderateServicePhoto(args);
    },

    purgeExpiredPhotos: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<PurgePhotosResult> => {
      requireRole(context.member ?? null, ["ADMIN"]);
      return purgeExpiredPhotos();
    },

    updateParishSettings: async (
      _parent: unknown,
      args: { input: UpdateParishSettingsInput },
      context: GraphQLContext,
    ): Promise<ParishSettingsRecord> => {
      requireRole(context.member ?? null, ["ADMIN"]);
      return updateParishSettings(args.input);
    },

    requestCheckinCode: async (
      _parent: unknown,
      args: { serviceId: string; channel?: string },
      context: GraphQLContext,
    ): Promise<CheckinCodeDispatchResult> => {
      const authenticated = requireRole(context.member ?? null, ["MEMBER", "USHER", "ADMIN"]);
      return requestCheckinCode(authenticated, args);
    },

    verifyCheckinCode: async (
      _parent: unknown,
      args: { serviceId: string; code: string },
      context: GraphQLContext,
    ): Promise<MarkPresentResult> => {
      const authenticated = requireRole(context.member ?? null, ["MEMBER", "USHER", "ADMIN"]);
      return verifyCheckinCode(authenticated, args);
    },
  },

  AttendanceRecord: {
    serviceName: async (parent: { serviceId?: string }): Promise<string> => {
      if (!parent.serviceId) return "Sunday Worship Service";
      const services = await listServices();
      const svc = services.find((s) => s.id === parent.serviceId);
      return svc?.name || "Sunday Worship Service";
    },
    serviceDate: async (parent: { serviceId?: string; checkedInAt?: string }): Promise<string> => {
      if (!parent.serviceId) {
        return parent.checkedInAt
          ? parent.checkedInAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10);
      }
      const services = await listServices();
      const svc = services.find((s) => s.id === parent.serviceId);
      return (
        svc?.serviceDate ||
        (parent.checkedInAt
          ? parent.checkedInAt.slice(0, 10)
          : new Date().toISOString().slice(0, 10))
      );
    },
  },
};
