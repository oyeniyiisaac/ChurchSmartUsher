import { GraphQLError } from "graphql";
import mongoose from "mongoose";

import { type AuthenticatedMember, toAuthenticatedMember } from "@/auth/session";
import {
  Activity,
  type ActivityDocument,
  Department,
  type DepartmentDocument,
  Member,
  type UserRole,
} from "@/db/models";
import { connectToDatabase } from "@/db/mongoose";
import { deleteImageFromCloudinary, uploadImageToCloudinary } from "./cloudinary";
import {
  type ActivityInput,
  activityInputSchema,
  type AssignAffiliationsInput,
  assignAffiliationsInputSchema,
  type DepartmentInput,
  departmentInputSchema,
  type UpdateProfileInput,
  updateProfileInputSchema,
} from "./validation";

export type DepartmentInfo = {
  id: string;
  name: string;
  description: string;
  icon: string;
  leadName: string;
  active: boolean;
  memberCount: number;
};

export type ActivityInfo = {
  id: string;
  name: string;
  description: string;
  schedule: string;
  icon: string;
  active: boolean;
  participantCount: number;
};

export type MembersFilterInput = {
  search?: string | null;
  department?: string | null;
  status?: string | null;
};

export function formatMemberCode(year: number, sequence: number): string {
  const paddedSeq = Math.max(1, sequence).toString().padStart(4, "0");
  return `CC-${year}-${paddedSeq}`;
}

export async function generateNextMemberCode(
  year: number = new Date().getFullYear(),
): Promise<string> {
  await connectToDatabase();
  const count = await Member.countDocuments();
  let candidate = formatMemberCode(year, count + 1);
  let exists = await Member.exists({ memberCode: candidate });
  let offset = 2;
  while (exists) {
    candidate = formatMemberCode(year, count + offset);
    exists = await Member.exists({ memberCode: candidate });
    offset += 1;
  }
  return candidate;
}

function toDepartmentInfo(doc: DepartmentDocument, memberCount: number = 0): DepartmentInfo {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? "",
    icon: doc.icon ?? "groups",
    leadName: doc.leadName ?? "",
    active: doc.active,
    memberCount,
  };
}

function toActivityInfo(doc: ActivityDocument, participantCount: number = 0): ActivityInfo {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? "",
    schedule: doc.schedule ?? "",
    icon: doc.icon ?? "menu_book",
    active: doc.active,
    participantCount,
  };
}

export async function getMyProfile(memberId: string): Promise<AuthenticatedMember> {
  await connectToDatabase();
  const member = await Member.findById(memberId);
  if (!member) {
    throw new GraphQLError("Member profile not found.", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  return toAuthenticatedMember(member);
}

export async function updateMyProfile(
  memberId: string,
  rawInput: UpdateProfileInput,
): Promise<AuthenticatedMember> {
  const parsed = updateProfileInputSchema.parse(rawInput);
  await connectToDatabase();

  const member = await Member.findById(memberId);
  if (!member) {
    throw new GraphQLError("Member profile not found.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  if (parsed.phone && parsed.phone !== member.phone) {
    const duplicate = await Member.findOne({
      phone: parsed.phone,
      _id: { $ne: member._id },
    });
    if (duplicate) {
      throw new GraphQLError("Another member is already registered with this phone number.", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    member.phone = parsed.phone;
  }

  member.fullName = parsed.fullName;
  if (parsed.email !== undefined) {
    member.email = parsed.email ?? undefined;
  }
  if (parsed.gender) {
    member.gender = parsed.gender;
  }
  if (parsed.emergencyContact !== undefined) {
    member.emergencyContact = parsed.emergencyContact ?? undefined;
  }
  if (parsed.notes !== undefined) {
    member.notes = parsed.notes ?? undefined;
  }

  if (parsed.avatarBase64 && parsed.avatarBase64.trim().length > 0) {
    try {
      const uploaded = await uploadImageToCloudinary({
        fileContentBase64: parsed.avatarBase64,
        folder: "rccg_jesus_house_ogbomosho/avatars",
      });
      if (member.avatarPublicId && member.avatarPublicId !== uploaded.publicId) {
        await deleteImageFromCloudinary(member.avatarPublicId);
      }
      member.avatarUrl = uploaded.secureUrl;
      member.avatarPublicId = uploaded.publicId;
    } catch {
      // Fallback to data URI in offline/test environment
      member.avatarUrl = parsed.avatarBase64.startsWith("data:")
        ? parsed.avatarBase64
        : `data:image/jpeg;base64,${parsed.avatarBase64}`;
    }
  } else if (parsed.avatarUrl !== undefined && parsed.avatarUrl !== null) {
    member.avatarUrl = parsed.avatarUrl;
  }

  await member.save();
  return toAuthenticatedMember(member);
}

export async function updateMemberRole(
  memberId: string,
  role: UserRole,
): Promise<AuthenticatedMember> {
  await connectToDatabase();
  const member = await Member.findById(memberId);
  if (!member) {
    throw new GraphQLError("Member not found.", {
      extensions: { code: "NOT_FOUND" },
    });
  }
  member.role = role;
  await member.save();
  return toAuthenticatedMember(member);
}

export async function listDepartments(): Promise<DepartmentInfo[]> {
  await connectToDatabase();
  const docs = await Department.find().sort({ name: 1 });
  const results: DepartmentInfo[] = [];

  for (const doc of docs) {
    const count = await Member.countDocuments({
      $or: [{ department: doc.name }, { departmentIds: doc._id }],
    });
    results.push(toDepartmentInfo(doc, count));
  }

  return results;
}

export async function listActivities(): Promise<ActivityInfo[]> {
  await connectToDatabase();
  const docs = await Activity.find().sort({ name: 1 });
  const results: ActivityInfo[] = [];

  for (const doc of docs) {
    const count = await Member.countDocuments({
      $or: [{ activities: doc.name }, { activityIds: doc._id }],
    });
    results.push(toActivityInfo(doc, count));
  }

  return results;
}

export async function listMembers(filter?: MembersFilterInput): Promise<AuthenticatedMember[]> {
  await connectToDatabase();
  const query: Record<string, unknown> = {};

  if (filter?.department && filter.department !== "ALL") {
    query.department = filter.department;
  }

  if (filter?.status && filter.status !== "ALL") {
    query.status = filter.status;
  }

  if (filter?.search && filter.search.trim().length > 0) {
    const escaped = filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    query.$or = [{ fullName: regex }, { phone: regex }, { memberCode: regex }, { email: regex }];
  }

  const docs = await Member.find(query).sort({ createdAt: 1 }).limit(100);
  return docs.map(toAuthenticatedMember);
}

export async function createDepartment(rawInput: DepartmentInput): Promise<DepartmentInfo> {
  const parsed = departmentInputSchema.parse(rawInput);
  await connectToDatabase();

  const existing = await Department.findOne({ name: parsed.name });
  if (existing) {
    throw new GraphQLError(`Department "${parsed.name}" already exists.`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const created = await Department.create({
    name: parsed.name,
    description: parsed.description,
    icon: parsed.icon,
    leadName: parsed.leadName,
    active: true,
  });

  return toDepartmentInfo(created, 0);
}

export async function createActivity(rawInput: ActivityInput): Promise<ActivityInfo> {
  const parsed = activityInputSchema.parse(rawInput);
  await connectToDatabase();

  const existing = await Activity.findOne({ name: parsed.name });
  if (existing) {
    throw new GraphQLError(`Activity "${parsed.name}" already exists.`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const created = await Activity.create({
    name: parsed.name,
    description: parsed.description,
    schedule: parsed.schedule,
    icon: parsed.icon,
    active: true,
  });

  return toActivityInfo(created, 0);
}

export async function assignMemberAffiliations(
  rawInput: AssignAffiliationsInput,
): Promise<AuthenticatedMember> {
  const parsed = assignAffiliationsInputSchema.parse(rawInput);
  await connectToDatabase();

  const member = await Member.findById(parsed.memberId);
  if (!member) {
    throw new GraphQLError("Member not found.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const validDeptObjectIds = parsed.departmentIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const validActivityObjectIds = parsed.activityIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const depts = await Department.find({ _id: { $in: validDeptObjectIds } });
  const acts = await Activity.find({ _id: { $in: validActivityObjectIds } });

  member.departmentIds = depts.map((d) => d._id);
  member.activityIds = acts.map((a) => a._id);

  if (depts.length > 0) {
    member.department = depts[0].name;
  }
  member.activities = acts.map((a) => a.name);

  await member.save();
  return toAuthenticatedMember(member);
}
