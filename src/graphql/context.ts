import type { NextRequest } from "next/server";

export interface GraphQLContext {
  request: NextRequest;
}

export async function createGraphQLContext(request: NextRequest): Promise<GraphQLContext> {
  return {
    request,
  };
}
