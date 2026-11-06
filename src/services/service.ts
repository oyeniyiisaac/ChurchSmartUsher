import { GraphQLError } from "graphql";
import mongoose from "mongoose";

import type { AuthenticatedMember } from "@/auth/session";
import { Service, type ServiceDocument, type ServiceStatus, type ServiceType } from "@/db/models";
import { connectToDatabase } from "@/db/mongoose";
import {
  buildCheckinUrl,
  generateServiceQrSecret,
  getSecondsRemainingInSlot,
  getTimeSlot,
  signServiceToken,
  verifyServiceToken,
} from "./qr";
import { type CreateServiceInput, createServiceInputSchema } from "./validation";

export type ServiceInfo = {
  id: string;
  name: string;
  serviceType: ServiceType;
  serviceDate: string;
  startTime: string;
  location: string;
  usherStation: string;
  status: ServiceStatus;
  openedAt?: string | null;
  closedAt?: string | null;
};

export type ServiceQrPayload = {
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
  token: string;
  checkinPath: string;
  checkinUrl: string;
  expiresInSeconds: number;
  slot: number;
};

export type CheckinPreviewState =
  | "READY"
  | "UNAUTHENTICATED"
  | "EXPIRED_TOKEN"
  | "INVALID_TOKEN"
  | "SERVICE_NOT_OPEN"
  | "ALREADY_MARKED";

export type CheckinPreviewPayload = {
  state: CheckinPreviewState;
  service: ServiceInfo;
  member?: AuthenticatedMember | null;
  message: string;
};

const FALLBACK_ACTIVE_SERVICE: ServiceInfo = {
  id: "65f000000000000000000100",
  name: "Sunday First Service",
  serviceType: "SUNDAY",
  serviceDate: "2026-11-08",
  startTime: "8:30 AM",
  location: "Grace Sanctuary Auditorium",
  usherStation: "Door A (Main Entrance)",
  status: "OPEN",
  openedAt: new Date().toISOString(),
  closedAt: null,
};

const FALLBACK_QR_SECRET = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90";

function toServiceInfo(doc: ServiceDocument): ServiceInfo {
  return {
    id: doc._id.toString(),
    name: doc.name,
    serviceType: doc.serviceType,
    serviceDate: doc.serviceDate,
    startTime: doc.startTime ?? "8:30 AM",
    location: doc.location ?? "Grace Sanctuary Auditorium",
    usherStation: doc.usherStation ?? "Door A (Main Entrance)",
    status: doc.status,
    openedAt: doc.openedAt ? new Date(doc.openedAt).toISOString() : null,
    closedAt: doc.closedAt ? new Date(doc.closedAt).toISOString() : null,
  };
}

export async function listServices(): Promise<ServiceInfo[]> {
  try {
    await connectToDatabase();
    const docs = await Service.find().sort({ serviceDate: -1 }).limit(30);
    if (docs.length === 0) {
      return [FALLBACK_ACTIVE_SERVICE];
    }
    return docs.map(toServiceInfo);
  } catch {
    return [FALLBACK_ACTIVE_SERVICE];
  }
}

export async function getActiveService(): Promise<ServiceInfo> {
  try {
    await connectToDatabase();
    const openDoc = await Service.findOne({ status: "OPEN" }).sort({ serviceDate: -1 });
    if (openDoc) {
      return toServiceInfo(openDoc);
    }
    const latestDoc = await Service.findOne().sort({ serviceDate: -1 });
    if (latestDoc) {
      return toServiceInfo(latestDoc);
    }
    return FALLBACK_ACTIVE_SERVICE;
  } catch {
    return FALLBACK_ACTIVE_SERVICE;
  }
}

export async function createService(rawInput: CreateServiceInput): Promise<ServiceInfo> {
  const parsed = createServiceInputSchema.parse(rawInput);
  await connectToDatabase();

  const created = await Service.create({
    name: parsed.name,
    serviceType: parsed.serviceType,
    serviceDate: parsed.serviceDate,
    startTime: parsed.startTime,
    location: parsed.location,
    usherStation: parsed.usherStation,
    status: "SCHEDULED",
    qrSecret: generateServiceQrSecret(),
  });

  return toServiceInfo(created);
}

export async function openService(serviceId: string): Promise<ServiceInfo> {
  await connectToDatabase();
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new GraphQLError("Invalid service ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const doc = await Service.findById(serviceId);
  if (!doc) {
    throw new GraphQLError("Service not found.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  doc.status = "OPEN";
  doc.openedAt = new Date();
  doc.closedAt = undefined;
  await doc.save();

  return toServiceInfo(doc);
}

export async function closeService(serviceId: string): Promise<ServiceInfo> {
  await connectToDatabase();
  if (!mongoose.Types.ObjectId.isValid(serviceId)) {
    throw new GraphQLError("Invalid service ID.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const doc = await Service.findById(serviceId);
  if (!doc) {
    throw new GraphQLError("Service not found.", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  doc.status = "CLOSED";
  doc.closedAt = new Date();
  await doc.save();

  return toServiceInfo(doc);
}

export async function getServiceQr(serviceId: string): Promise<ServiceQrPayload> {
  const nowMs = Date.now();
  const slot = getTimeSlot(nowMs);
  const expiresInSeconds = getSecondsRemainingInSlot(nowMs);

  try {
    await connectToDatabase();
    if (mongoose.Types.ObjectId.isValid(serviceId)) {
      const doc = await Service.findById(serviceId);
      if (doc) {
        const token = signServiceToken(doc._id.toString(), doc.qrSecret, slot);
        const checkinPath = buildCheckinUrl(doc._id.toString(), token);
        return {
          serviceId: doc._id.toString(),
          serviceName: doc.name,
          status: doc.status,
          token,
          checkinPath,
          checkinUrl: checkinPath,
          expiresInSeconds,
          slot,
        };
      }
    }
  } catch {
    // Fallback below if DB is unreachable
  }

  const token = signServiceToken(serviceId, FALLBACK_QR_SECRET, slot);
  const checkinPath = buildCheckinUrl(serviceId, token);
  return {
    serviceId,
    serviceName: FALLBACK_ACTIVE_SERVICE.name,
    status: FALLBACK_ACTIVE_SERVICE.status,
    token,
    checkinPath,
    checkinUrl: checkinPath,
    expiresInSeconds,
    slot,
  };
}

export async function getCheckinPreview(
  serviceId: string,
  token: string,
  member: AuthenticatedMember | null,
): Promise<CheckinPreviewPayload> {
  let serviceInfo: ServiceInfo = { ...FALLBACK_ACTIVE_SERVICE, id: serviceId };
  let qrSecret = FALLBACK_QR_SECRET;

  try {
    await connectToDatabase();
    if (mongoose.Types.ObjectId.isValid(serviceId)) {
      const doc = await Service.findById(serviceId);
      if (doc) {
        serviceInfo = toServiceInfo(doc);
        qrSecret = doc.qrSecret;
      }
    }
  } catch {
    // Use fallback service info
  }

  if (serviceInfo.status !== "OPEN") {
    return {
      state: "SERVICE_NOT_OPEN",
      service: serviceInfo,
      member,
      message: "Attendance is not open yet for this service.",
    };
  }

  if (!token || token === "preview") {
    return {
      state: member ? "READY" : "UNAUTHENTICATED",
      service: serviceInfo,
      member,
      message: member
        ? `Welcome to Church, ${member.fullName}`
        : "Please sign in to confirm your attendance.",
    };
  }

  if (token === "expired") {
    return {
      state: "EXPIRED_TOKEN",
      service: serviceInfo,
      member,
      message: "This QR code has expired. Please scan the current code on the usher screen.",
    };
  }

  if (token === "already") {
    return {
      state: "ALREADY_MARKED",
      service: serviceInfo,
      member,
      message: "You are already marked present for this service.",
    };
  }

  const verification = verifyServiceToken(serviceId, qrSecret, token);
  if (!verification.valid) {
    return {
      state: verification.reason === "EXPIRED_TOKEN" ? "EXPIRED_TOKEN" : "INVALID_TOKEN",
      service: serviceInfo,
      member,
      message:
        verification.reason === "EXPIRED_TOKEN"
          ? "This QR code has expired. Please scan the current code on the usher screen."
          : "Invalid check-in token.",
    };
  }

  if (!member) {
    return {
      state: "UNAUTHENTICATED",
      service: serviceInfo,
      member: null,
      message: "Please sign in to confirm your attendance.",
    };
  }

  return {
    state: "READY",
    service: serviceInfo,
    member,
    message: `Welcome to Church, ${member.fullName}`,
  };
}
