import mongoose, { type InferSchemaType, type Model, Schema } from "mongoose";

export const USER_ROLES = ["MEMBER", "USHER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEMBER_GENDERS = ["Male", "Female"] as const;
export type MemberGender = (typeof MEMBER_GENDERS)[number];

export const SERVICE_TYPES = ["SUNDAY", "MIDWEEK", "SPECIAL"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_STATUSES = ["SCHEDULED", "OPEN", "CLOSED"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

export const ATTENDANCE_METHODS = ["QR", "MANUAL", "GUEST"] as const;
export type AttendanceMethod = (typeof ATTENDANCE_METHODS)[number];

export const PHOTO_STATUSES = ["PUBLISHED", "APPROVED", "PENDING", "REJECTED"] as const;
export type PhotoStatus = (typeof PHOTO_STATUSES)[number];

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "", trim: true },
    icon: { type: String, default: "groups", trim: true },
    leadName: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

const activitySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "", trim: true },
    schedule: { type: String, default: "", trim: true },
    icon: { type: String, default: "menu_book", trim: true },
    active: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

const memberSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: false, trim: true },
    gender: { type: String, enum: MEMBER_GENDERS, default: "Male", required: false },
    avatarUrl: { type: String, default: "", trim: true },
    avatarPublicId: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: "MEMBER", required: true },
    status: { type: String, default: "ACTIVE", required: true },
    department: { type: String, default: "Unassigned", required: true },
    activities: { type: [String], default: [] },
    departmentIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Department" }],
      default: [],
    },
    activityIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Activity" }],
      default: [],
    },
    memberCode: { type: String, required: true, unique: true },
    emergencyContact: { type: String, required: false, trim: true },
    notes: { type: String, required: false, trim: true },
    currentStreak: { type: Number, default: 0, required: true },
    longestStreak: { type: Number, default: 0, required: true },
    consentAcceptedAt: { type: Date, default: () => new Date(), required: true },
  },
  { timestamps: true },
);

const sessionSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Automatic TTL index removing expired sessions from MongoDB
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    serviceType: { type: String, enum: SERVICE_TYPES, default: "SUNDAY", required: true },
    serviceDate: { type: String, required: true, index: true },
    startTime: { type: String, default: "8:30 AM", required: true },
    location: {
      type: String,
      default: "RCCG JESUS HOUSE, OGBOMOSHO Auditorium",
      required: true,
    },
    usherStation: { type: String, default: "Door A (Main Entrance)", required: true },
    status: { type: String, enum: SERVICE_STATUSES, default: "SCHEDULED", required: true },
    qrSecret: { type: String, default: "default-service-qr-secret-key-2026", required: true },
    openedAt: { type: Date, required: false },
    closedAt: { type: Date, required: false },
  },
  { timestamps: true },
);

const attendanceSchema = new Schema(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: "Member",
      required: false,
      index: true,
    },
    memberName: { type: String, required: true, trim: true },
    memberPhone: { type: String, default: "", trim: true },
    memberDepartment: { type: String, default: "Unassigned", trim: true },
    memberCode: { type: String, default: "", trim: true },
    isGuest: { type: Boolean, default: false, required: true },
    invitedBy: { type: String, default: "", trim: true },
    method: { type: String, enum: ATTENDANCE_METHODS, default: "QR", required: true },
    markedByUsherId: { type: Schema.Types.ObjectId, ref: "Member", required: false },
    markedByUsherName: { type: String, default: "", trim: true },
    station: { type: String, default: "Door A (Main Entrance)", required: true, trim: true },
    checkedInAt: { type: Date, default: () => new Date(), required: true },
  },
  { timestamps: true },
);

// Unique compound index: one attendance record per (serviceId, memberId)
attendanceSchema.index(
  { serviceId: 1, memberId: 1 },
  {
    unique: true,
    partialFilterExpression: { memberId: { $type: "objectId" } },
  },
);

const photoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    albumKey: { type: String, default: "today", required: true, index: true },
    albumTitle: {
      type: String,
      default: "Sunday Service - RCCG JESUS HOUSE, OGBOMOSHO",
      required: true,
    },
    serviceDate: { type: String, required: true },
    photographer: { type: String, default: "Media Department", trim: true },
    imageUrl: { type: String, required: true },
    storageKey: { type: String, required: true, unique: true },
    fileSizeLabel: { type: String, default: "1.0 MB" },
    fileSizeBytes: { type: Number, default: 1_000_000 },
    tags: { type: [String], default: [] },
    status: { type: String, enum: PHOTO_STATUSES, default: "PUBLISHED", required: true },
    needsConsentCheck: { type: Boolean, default: false, required: true },
    uploadedAt: { type: Date, default: () => new Date(), required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

photoSchema.index({ expiresAt: 1, status: 1 });

const parishSettingsSchema = new Schema(
  {
    parishName: {
      type: String,
      default: "RCCG JESUS HOUSE, OGBOMOSHO",
      required: true,
      trim: true,
    },
    denomination: {
      type: String,
      default: "The Redeemed Christian Church of God (RCCG)",
      required: true,
      trim: true,
    },
    foyerDesks: {
      type: [String],
      default: ["Door A (Main Entrance)", "Door B (Gallery Ramp)", "Foyer Desk #1 (Guest Lounge)"],
    },
    qrRotationSeconds: { type: Number, default: 45, required: true },
    geofenceEnabled: { type: Boolean, default: true, required: true },
    geofenceRadiusMeters: { type: Number, default: 150, required: true },
    sanctuaryLatitude: { type: Number, default: 8.1333, required: true },
    sanctuaryLongitude: { type: Number, default: 4.2567, required: true },
    duplicateScanDefense: { type: Boolean, default: true, required: true },
    childMinorShieldEnabled: { type: Boolean, default: true, required: true },
    compressionProfile: {
      type: String,
      default: "Cloudinary Auto WebP (85% Quality)",
      required: true,
    },
  },
  { timestamps: true },
);

export type DepartmentDocument = InferSchemaType<typeof departmentSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ActivityDocument = InferSchemaType<typeof activitySchema> & {
  _id: mongoose.Types.ObjectId;
};
export type MemberDocument = InferSchemaType<typeof memberSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type SessionDocument = InferSchemaType<typeof sessionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ServiceDocument = InferSchemaType<typeof serviceSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type AttendanceDocument = InferSchemaType<typeof attendanceSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type PhotoDocument = InferSchemaType<typeof photoSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ParishSettingsDocument = InferSchemaType<typeof parishSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
  updatedAt?: Date;
};

export const Department: Model<DepartmentDocument> =
  (mongoose.models.Department as Model<DepartmentDocument>) ||
  mongoose.model<DepartmentDocument>("Department", departmentSchema);

export const Activity: Model<ActivityDocument> =
  (mongoose.models.Activity as Model<ActivityDocument>) ||
  mongoose.model<ActivityDocument>("Activity", activitySchema);

export const Member: Model<MemberDocument> =
  (mongoose.models.Member as Model<MemberDocument>) ||
  mongoose.model<MemberDocument>("Member", memberSchema);

export const Session: Model<SessionDocument> =
  (mongoose.models.Session as Model<SessionDocument>) ||
  mongoose.model<SessionDocument>("Session", sessionSchema);

export const Service: Model<ServiceDocument> =
  (mongoose.models.Service as Model<ServiceDocument>) ||
  mongoose.model<ServiceDocument>("Service", serviceSchema);

export const Attendance: Model<AttendanceDocument> =
  (mongoose.models.Attendance as Model<AttendanceDocument>) ||
  mongoose.model<AttendanceDocument>("Attendance", attendanceSchema);

export const Photo: Model<PhotoDocument> =
  (mongoose.models.Photo as Model<PhotoDocument>) ||
  mongoose.model<PhotoDocument>("Photo", photoSchema);

export const ParishSettingsModel: Model<ParishSettingsDocument> =
  (mongoose.models.ParishSettings as Model<ParishSettingsDocument>) ||
  mongoose.model<ParishSettingsDocument>("ParishSettings", parishSettingsSchema);
