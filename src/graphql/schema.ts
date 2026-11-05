export const typeDefs = `#graphql
  type PingResult {
    status: String!
    timestamp: String!
    version: String!
  }

  type Query {
    ping: PingResult!
  }
`;
