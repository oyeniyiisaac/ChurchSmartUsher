export type AccessMemberIdentity = {
  role: "MEMBER" | "USHER" | "ADMIN" | string;
  department?: string | null;
  activities?: string[] | null;
};

const MEDIA_UNIT_PATTERN = /\b(media|photography|camera|multimedia|technical)\b/i;
const USHER_UNIT_PATTERN = /\b(usher|ushering|protocol)\b/i;

export function isMediaUnitName(name?: string | null): boolean {
  if (!name) return false;
  return MEDIA_UNIT_PATTERN.test(name.trim());
}

export function isUsherUnitName(name?: string | null): boolean {
  if (!name) return false;
  return USHER_UNIT_PATTERN.test(name.trim());
}

export function isMediaUnitMember(member?: AccessMemberIdentity | null): boolean {
  if (!member) return false;
  if (isMediaUnitName(member.department)) return true;
  return (member.activities ?? []).some((act) => isMediaUnitName(act));
}

export function isUsherUnitMember(member?: AccessMemberIdentity | null): boolean {
  if (!member) return false;
  if (isUsherUnitName(member.department)) return true;
  return (member.activities ?? []).some((act) => isUsherUnitName(act));
}

export function hasAdminAccess(member?: AccessMemberIdentity | null): boolean {
  return member?.role === "ADMIN";
}

export function hasUsherAccess(member?: AccessMemberIdentity | null): boolean {
  if (!member) return false;
  return member.role === "ADMIN" || member.role === "USHER" || isUsherUnitMember(member);
}

export function hasPhotoUploadAccess(member?: AccessMemberIdentity | null): boolean {
  if (!member) return false;
  return member.role === "ADMIN" || isMediaUnitMember(member);
}

export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/checkin" ||
    pathname.startsWith("/checkin/") ||
    pathname === "/streak" ||
    pathname === "/photos" ||
    pathname.startsWith("/photos/")
  );
}

export function canMemberAccessPath(
  member: AccessMemberIdentity | null | undefined,
  pathname: string,
): boolean {
  if (isPublicRoute(pathname)) {
    return true;
  }

  if (!member) {
    return false;
  }

  // Media Unit & Admin have access to the Service Photo Upload Hub (/admin/photos)
  if (pathname === "/admin/photos" || pathname.startsWith("/admin/photos/")) {
    return hasPhotoUploadAccess(member);
  }

  // Usher Portal routes (/usher and /usher/live) require USHER (or Ushering unit) or ADMIN
  if (pathname === "/usher" || pathname.startsWith("/usher/")) {
    return hasUsherAccess(member);
  }

  // Admin Console routes require ADMIN only
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/members" ||
    pathname.startsWith("/members/") ||
    pathname === "/departments" ||
    pathname.startsWith("/departments/") ||
    pathname === "/services" ||
    pathname.startsWith("/services/") ||
    pathname === "/reports" ||
    pathname.startsWith("/reports/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/design-system"
  ) {
    return hasAdminAccess(member);
  }

  // Member Portal routes (/dashboard, /streak, /photos, /profile) are open to all authenticated members
  return true;
}

export function getRoleLandingPath(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "USHER":
      return "/usher";
    case "MEMBER":
    default:
      return "/dashboard";
  }
}

export function getMemberLandingPath(member: AccessMemberIdentity): string {
  if (hasAdminAccess(member)) {
    return "/admin";
  }
  if (hasUsherAccess(member)) {
    return "/usher";
  }
  return "/dashboard";
}
