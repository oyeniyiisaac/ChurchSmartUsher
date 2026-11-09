export const typeDefs = `#graphql
  enum Role {
    MEMBER
    USHER
    ADMIN
  }

  enum ServiceType {
    SUNDAY
    MIDWEEK
    SPECIAL
  }

  enum ServiceStatus {
    SCHEDULED
    OPEN
    CLOSED
  }

  enum CheckinPreviewState {
    READY
    UNAUTHENTICATED
    EXPIRED_TOKEN
    INVALID_TOKEN
    SERVICE_NOT_OPEN
    ALREADY_MARKED
  }

  enum AttendanceMethod {
    QR
    MANUAL
    GUEST
  }

  enum MarkPresentStatus {
    MARKED_PRESENT
    ALREADY_MARKED
    EXPIRED_TOKEN
    INVALID_TOKEN
    SERVICE_NOT_OPEN
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
    avatarUrl: String
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

  type Service {
    id: ID!
    name: String!
    serviceTag: String!
    sermonTopic: String!
    serviceType: ServiceType!
    serviceDate: String!
    startTime: String!
    location: String!
    usherStation: String!
    status: ServiceStatus!
    openedAt: String
    closedAt: String
  }

  type ServiceQrPayload {
    serviceId: ID!
    serviceName: String!
    status: ServiceStatus!
    token: String!
    checkinPath: String!
    checkinUrl: String!
    expiresInSeconds: Int!
    slot: Int!
  }

  type CheckinPreview {
    state: CheckinPreviewState!
    service: Service!
    member: Member
    message: String!
  }

  type AttendanceRecord {
    id: ID!
    serviceId: ID!
    serviceName: String
    serviceDate: String
    memberId: ID
    memberName: String!
    memberPhone: String!
    memberDepartment: String!
    memberCode: String!
    isGuest: Boolean!
    invitedBy: String!
    method: AttendanceMethod!
    markedByUsherName: String!
    station: String!
    checkedInAt: String!
  }

  type MarkPresentResult {
    status: MarkPresentStatus!
    message: String!
    attendance: AttendanceRecord
  }

  type ServiceAttendanceSummary {
    serviceId: ID!
    totalCount: Int!
    memberCount: Int!
    guestCount: Int!
    qrCount: Int!
    manualCount: Int!
    records: [AttendanceRecord!]!
  }

  type StreakBadge {
    code: String!
    title: String!
    threshold: Int!
    unlocked: Boolean!
    progressCount: Int!
    subtitle: String!
  }

  type StreakCalendarEntry {
    serviceId: ID!
    label: String!
    subtitle: String!
    status: String!
  }

  type StreakSummary {
    currentStreak: Int!
    longestStreak: Int!
    totalInYear: Int!
    monthCompletedLabel: String!
    badges: [StreakBadge!]!
    calendarEntries: [StreakCalendarEntry!]!
  }

  type ServiceArchiveRow {
    id: ID!
    name: String!
    dateLabel: String!
    serviceTypeLabel: String!
    attendanceCount: Int!
    memberVsGuestLabel: String!
    memberRatioPercent: Float!
    capacityPercent: Int!
    scanVsManualLabel: String!
    usherName: String!
    usherInitials: String!
    statusLabel: String!
    isPeak: Boolean!
  }

  type AttendanceReportsSummary {
    totalRecordedQ4: Int!
    avgSundayTurnout: Int!
    digitalScanPercent: Float!
    visitorRetentionPercent: Int!
    archiveRows: [ServiceArchiveRow!]!
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
    avatarBase64: String
    avatarUrl: String
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

  input CreateServiceInput {
    name: String!
    serviceTag: String
    sermonTopic: String
    serviceType: ServiceType
    serviceDate: String!
    startTime: String
    location: String
    usherStation: String
    openImmediately: Boolean
  }

  input RegisterGuestInput {
    serviceId: ID!
    fullName: String!
    phone: String!
    invitedBy: String
    station: String
  }

  type ServicePhoto {
    id: ID!
    title: String!
    fileName: String!
    albumKey: String!
    albumTitle: String!
    serviceDate: String!
    photographer: String!
    imageUrl: String!
    mediaType: String!
    storageKey: String!
    fileSizeLabel: String!
    fileSizeBytes: Int!
    tags: [String!]!
    status: String!
    needsConsentCheck: Boolean!
    uploadedAt: String!
    expiresAt: String!
    daysLeftLabel: String!
    daysLeftCount: Int!
  }

  type AdminPhotoHubOverview {
    totalCount: Int!
    publishedCount: Int!
    pendingCount: Int!
    flaggedCount: Int!
    storageUsedLabel: String!
    storageLimitLabel: String!
    policyPurgeCountdown: String!
    photos: [ServicePhoto!]!
  }

  type PurgePhotosResult {
    deletedCount: Int!
    deletedKeys: [String!]!
    reclaimedBytes: Int!
  }

  input UploadServicePhotoInput {
    title: String!
    fileName: String!
    albumKey: String
    albumTitle: String
    serviceDate: String
    photographer: String
    imageUrl: String
    mediaType: String
    fileSizeLabel: String
    tags: [String!]
    status: String
    needsConsentCheck: Boolean
    fileContentBase64: String
  }

  type ParishSettings {
    parishName: String!
    denomination: String!
    foyerDesks: [String!]!
    qrRotationSeconds: Int!
    geofenceEnabled: Boolean!
    geofenceRadiusMeters: Int!
    sanctuaryLatitude: Float!
    sanctuaryLongitude: Float!
    duplicateScanDefense: Boolean!
    childMinorShieldEnabled: Boolean!
    compressionProfile: String!
    updatedAt: String!
  }

  type GeofenceCheckResult {
    withinGeofence: Boolean!
    distanceMeters: Int!
    maxRadiusMeters: Int!
  }

  type CheckinCodeDispatchResult {
    serviceId: ID!
    channel: String!
    maskedDestination: String!
    expiresAt: String!
    code: String!
  }

  type OtpDispatchResult {
    phone: String!
    maskedPhone: String!
    channel: String!
    purpose: String!
    expiresAt: String!
    code: String!
    whatsappDeepLink: String
    smsDeepLink: String
    deliveryNote: String!
  }

  type PasswordResetResult {
    success: Boolean!
    message: String!
  }

  input UpdateParishSettingsInput {
    parishName: String
    denomination: String
    qrRotationSeconds: Int
    geofenceEnabled: Boolean
    geofenceRadiusMeters: Int
    childMinorShieldEnabled: Boolean
    compressionProfile: String
  }

  type Query {
    ping: PingResult!
    me: Member
    myProfile: Member!
    myAttendanceHistory: [AttendanceRecord!]!
    myStreak(serviceType: ServiceType): StreakSummary!
    departments: [Department!]!
    activities: [Activity!]!
    members(filter: MembersFilterInput): [Member!]!
    services: [Service!]!
    activeService: Service!
    serviceQr(serviceId: ID!): ServiceQrPayload!
    checkinPreview(serviceId: ID!, token: String!): CheckinPreview!
    serviceAttendance(serviceId: ID!): ServiceAttendanceSummary!
    attendanceReports: AttendanceReportsSummary!
    exportAttendanceCsv(serviceId: ID): String!
    servicePhotos(albumKey: String): [ServicePhoto!]!
    servicePhoto(id: ID!): ServicePhoto
    adminPhotoHub(statusFilter: String, tagFilter: String): AdminPhotoHubOverview!
    parishSettings: ParishSettings!
    verifyGeofence(latitude: Float!, longitude: Float!): GeofenceCheckResult!
    adminOnlyCheck: String!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
    updateMyProfile(input: UpdateProfileInput!): Member!
    updateMemberRole(memberId: ID!, role: Role!): Member!
    createDepartment(input: DepartmentInput!): Department!
    createActivity(input: ActivityInput!): Activity!
    assignMemberAffiliations(input: AssignAffiliationsInput!): Member!
    createService(input: CreateServiceInput!): Service!
    openService(serviceId: ID!): Service!
    closeService(serviceId: ID!): Service!
    markPresent(serviceId: ID!, token: String!): MarkPresentResult!
    markManualPresent(serviceId: ID!, memberId: ID!, station: String): MarkPresentResult!
    registerGuestAttendance(input: RegisterGuestInput!): AttendanceRecord!
    undoAttendance(attendanceId: ID!): Boolean!
    uploadServicePhoto(input: UploadServicePhotoInput!): ServicePhoto!
    moderateServicePhoto(photoId: ID!, action: String!): ServicePhoto!
    purgeExpiredPhotos: PurgePhotosResult!
    updateParishSettings(input: UpdateParishSettingsInput!): ParishSettings!
    requestCheckinCode(serviceId: ID!, channel: String): CheckinCodeDispatchResult!
    verifyCheckinCode(serviceId: ID!, code: String!): MarkPresentResult!
    requestAuthOtp(phone: String!, channel: String, purpose: String): OtpDispatchResult!
    verifyLoginOtp(phone: String!, code: String!, returnTo: String): AuthPayload!
    resetPasswordWithOtp(phone: String!, code: String!, newPassword: String!): PasswordResetResult!
  }
`;
