export const typeDefs = `#graphql
  enum Role {
    MEMBER
    USHER
    ADMIN
  }

  type PingResult {
    status: String!
    timestamp: String!
    version: String!
  }

  type Member {
    id: ID!
    fullName: String!
    phone: String!
    email: String
    role: Role!
    department: String!
    activities: [String!]!
    memberCode: String!
    currentStreak: Int!
    longestStreak: Int!
  }

  type AuthPayload {
    member: Member!
    redirectTo: String!
  }

  input RegisterInput {
    fullName: String!
    phone: String!
    email: String
    password: String!
    department: String
    consent: Boolean!
    returnTo: String
  }

  input LoginInput {
    phone: String!
    password: String!
    returnTo: String
  }

  type Query {
    ping: PingResult!
    me: Member
    adminOnlyCheck: String!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
  }
`;
