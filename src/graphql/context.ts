import type { NextRequest } from "next/server";

import { type AuthenticatedMember, getCurrentMember } from "@/auth/session";

export interface GraphQLContext {
  request?: NextRequest;
  member: AuthenticatedMember | null;
}

export async function createGraphQLContext(request: NextRequest): Promise<GraphQLContext> {
  const member = await getCurrentMember();
  return {
    request,
    member,
  };
}
