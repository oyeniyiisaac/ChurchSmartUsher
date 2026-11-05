import { ApolloServer } from "@apollo/server";
import { describe, expect, it } from "vitest";

import { resolvers } from "@/graphql/resolvers";
import { typeDefs } from "@/graphql/schema";

describe("GraphQL Ping Query", () => {
  it("returns status ok with timestamp and version", async () => {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    const response = await server.executeOperation({
      query: `
        query TestPing {
          ping {
            status
            timestamp
            version
          }
        }
      `,
    });

    expect(response.body.kind).toBe("single");
    if (response.body.kind === "single") {
      expect(response.body.singleResult.errors).toBeUndefined();
      const pingData = response.body.singleResult.data?.ping as {
        status: string;
        timestamp: string;
        version: string;
      };
      expect(pingData.status).toBe("ok");
      expect(pingData.version).toBe("0.1.0");
      expect(new Date(pingData.timestamp).getTime()).not.toBeNaN();
    }
  });
});
