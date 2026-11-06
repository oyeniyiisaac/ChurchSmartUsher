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

  type Department {
    id: ID!
    name: String!
    description: String!
    icon: String!
    leadName: String!
    active: Boolean!
    memberCount: Int!
  }

  type Activity {
    id: ID!
    name: String!
    description: String!
    schedule: String!
    icon: String!
    active: Boolean!
    participantCount: Int!
  }

  type Member {
    id: ID!
    fullName: String!
    phone: String!
    email: String
    gender: String
    role: Role!
    status: String!
    department: String!
    activities: [String!]!
    departmentIds: [ID!]!
    activityIds: [ID!]!
    memberCode: String!
    emergencyContact: String
    notes: String
    currentStreak: Int!
    longestStreak: Int!
    consentGivenAt: String!
  }

  type AuthPayload {
    member: Member!
    redirectTo: String!
  }

  input RegisterInput {
    fullName: String!
    phone: String!
    email: String
    gender: String
    password: String!
    department: String
    consent: Boolean
    consentGiven: Boolean
    returnTo: String
  }

  input LoginInput {
    phone: String!
    password: String!
    returnTo: String
  }

  input UpdateProfileInput {
    fullName: String!
    phone: String
    email: String
    gender: String
    emergencyContact: String
    notes: String
  }

  input DepartmentInput {
    name: String!
    description: String
    icon: String
    leadName: String
  }

  input ActivityInput {
    name: String!
    description: String
    schedule: String
    icon: String
  }

  input AssignAffiliationsInput {
    memberId: ID!
    departmentIds: [ID!]!
    activityIds: [ID!]!
  }

  input MembersFilterInput {
    search: String
    department: String
    status: String
  }

  type Query {
    ping: PingResult!
    me: Member
    myProfile: Member!
    departments: [Department!]!
    activities: [Activity!]!
    members(filter: MembersFilterInput): [Member!]!
    adminOnlyCheck: String!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
    updateMyProfile(input: UpdateProfileInput!): Member!
    createDepartment(input: DepartmentInput!): Department!
    createActivity(input: ActivityInput!): Activity!
    assignMemberAffiliations(input: AssignAffiliationsInput!): Member!
  }
`;
