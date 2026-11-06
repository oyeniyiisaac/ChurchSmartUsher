import mongoose, { type InferSchemaType, type Model, Schema } from "mongoose";

export const USER_ROLES = ["MEMBER", "USHER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SERVICE_TYPES = ["SUNDAY", "MIDWEEK", "SPECIAL"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_STATUSES = ["SCHEDULED", "OPEN", "CLOSED"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

const memberSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: false, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: "MEMBER", required: true },
    department: { type: String, default: "General Assembly", required: true },
    activities: { type: [String], default: [] },
    memberCode: { type: String, required: true, unique: true },
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
    status: { type: String, enum: SERVICE_STATUSES, default: "SCHEDULED", required: true },
    openedAt: { type: Date, required: false },
    closedAt: { type: Date, required: false },
  },
  { timestamps: true },
);

export type MemberDocument = InferSchemaType<typeof memberSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type SessionDocument = InferSchemaType<typeof sessionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type ServiceDocument = InferSchemaType<typeof serviceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Member: Model<MemberDocument> =
  (mongoose.models.Member as Model<MemberDocument>) ||
  mongoose.model<MemberDocument>("Member", memberSchema);

export const Session: Model<SessionDocument> =
  (mongoose.models.Session as Model<SessionDocument>) ||
  mongoose.model<SessionDocument>("Session", sessionSchema);

export const Service: Model<ServiceDocument> =
  (mongoose.models.Service as Model<ServiceDocument>) ||
  mongoose.model<ServiceDocument>("Service", serviceSchema);
