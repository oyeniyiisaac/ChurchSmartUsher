import { hashPassword } from "../src/auth/password";
import {
  Activity,
  type ActivityDocument,
  Attendance,
  Department,
  type DepartmentDocument,
  Member,
  type MemberDocument,
  Photo,
  Service,
  type ServiceDocument,
  type UserRole,
} from "../src/db/models";
import { connectToDatabase } from "../src/db/mongoose";
import { SEVEN_DAYS_MS } from "../src/services/photo";
import { formatMemberCode } from "../src/services/profile";
import { generateServiceQrSecret } from "../src/services/qr";
import { normalizePhoneNumber } from "../src/services/validation";

const DEFAULT_PASSWORD = "ChangeMe123!";

const SEED_DEPARTMENTS = [
  {
    name: "Sanctuary Choir",
    description: "Vocalists, Choir Directors, and Worship Instrumentation",
    icon: "music_note",
    leadName: "Isaac Olumide Adeleke",
  },
  {
    name: "Ushering & Protocol",
    description: "Sanctuary Foyer Reception, QR Display & Seating Order",
    icon: "groups",
    leadName: "Sister Chioma Nwosu",
  },
  {
    name: "Media & Sound",
    description: "Broadcast Engineering, Acoustics, and Sunday Photo Roll",
    icon: "videocam",
    leadName: "Femi Awolowo",
  },
  {
    name: "Youth Fellowship",
    description: "Young Adults Ministry, Campus Outreach & Mentorship",
    icon: "diversity_3",
    leadName: "Isaac Olumide Adeleke",
  },
  {
    name: "Sunday School",
    description: "Foundational Bible Teaching & Discipleship Classes",
    icon: "school",
    leadName: "Deacon Samuel Okon",
  },
  {
    name: "Women of Grace",
    description: "Mothers & Sisters Prayer, Welfare, and Community Support",
    icon: "volunteer_activism",
    leadName: "Sister Grace Adebayo",
  },
  {
    name: "Men's Fellowship",
    description: "Elders & Brothers Leadership, Facility & Parish Stewardship",
    icon: "shield_person",
    leadName: "Elder Babatunde Bakare",
  },
];

const SEED_ACTIVITIES = [
  {
    name: "Sunday School Class 4",
    description: "Young Adults & Career Professionals Bible Exposition",
    schedule: "Sundays · 7:15 AM – 8:00 AM",
    icon: "school",
  },
  {
    name: "Midweek Bible Study",
    description: "Wednesday Evening Digging Deep & Scriptural Study",
    schedule: "Wednesdays · 6:00 PM – 7:30 PM",
    icon: "auto_stories",
  },
  {
    name: "Discipleship Cohort",
    description: "8-Week Spiritual Growth & Leadership Track",
    schedule: "Saturdays · 4:00 PM – 5:30 PM",
    icon: "diversity_3",
  },
  {
    name: "Believers Baptism Class",
    description: "Foundational Faith & Immersion Preparation Cohort",
    schedule: "Sundays · 11:00 AM – 12:00 PM",
    icon: "water_drop",
  },
];

async function runSeed(): Promise<void> {
  await connectToDatabase();
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  const deptDocs: DepartmentDocument[] = [];
  for (const dept of SEED_DEPARTMENTS) {
    const doc = await Department.findOneAndUpdate(
      { name: dept.name },
      { $set: { ...dept, active: true } },
      { upsert: true, new: true },
    );
    deptDocs.push(doc);
  }

  const activityDocs: ActivityDocument[] = [];
  for (const act of SEED_ACTIVITIES) {
    const doc = await Activity.findOneAndUpdate(
      { name: act.name },
      { $set: { ...act, active: true } },
      { upsert: true, new: true },
    );
    activityDocs.push(doc);
  }

  const accounts: Array<{
    fullName: string;
    phone: string;
    email: string;
    gender: "Male" | "Female";
    role: UserRole;
    status: string;
    department: string;
    activities: string[];
    departmentIds: (typeof deptDocs)[number]["_id"][];
    activityIds: (typeof activityDocs)[number]["_id"][];
    memberCode: string;
    notes: string;
    currentStreak: number;
    longestStreak: number;
  }> = [
    {
      fullName: "Pastor Emmanuel Adewale",
      phone: normalizePhoneNumber("08000000001"),
      email: "pastor.emmanuel@churchconnect.ng",
      gender: "Male",
      role: "ADMIN",
      status: "ACTIVE",
      department: "Men's Fellowship",
      activities: ["Sunday School Class 4", "Midweek Bible Study"],
      departmentIds: [deptDocs[6]._id, deptDocs[4]._id],
      activityIds: [activityDocs[0]._id, activityDocs[1]._id],
      memberCode: formatMemberCode(2026, 1),
      notes: "Lead Pastor & Parish Administrator at Grace Sanctuary Parish, Lagos.",
      currentStreak: 12,
      longestStreak: 16,
    },
    {
      fullName: "Brother Emmanuel Kalu",
      phone: normalizePhoneNumber("08000000002"),
      email: "emmanuel.kalu@churchconnect.ng",
      gender: "Male",
      role: "USHER",
      status: "ACTIVE",
      department: "Ushering & Protocol",
      activities: ["Sunday School Class 4", "Midweek Bible Study"],
      departmentIds: [deptDocs[1]._id],
      activityIds: [activityDocs[0]._id, activityDocs[1]._id],
      memberCode: formatMemberCode(2026, 2),
      notes: "Head Usher coordinating Door A Main Entrance & Foyer QR Kiosk.",
      currentStreak: 9,
      longestStreak: 14,
    },
    {
      fullName: "Isaac Olumide Adeleke",
      phone: normalizePhoneNumber("08000000003"),
      email: "isaac.adeleke@gmail.com",
      gender: "Male",
      role: "MEMBER",
      status: "ACTIVE",
      department: "Sanctuary Choir",
      activities: ["Sunday School Class 4", "Midweek Bible Study", "Discipleship Cohort"],
      departmentIds: [deptDocs[0]._id, deptDocs[3]._id],
      activityIds: [activityDocs[0]._id, activityDocs[1]._id, activityDocs[2]._id],
      memberCode: "CC-2024-0482",
      notes:
        "Checked in regarding final exams preparation. Isaac confirmed he will be available to sing in the choir for the upcoming Annual Thanksgiving service.",
      currentStreak: 7,
      longestStreak: 14,
    },
  ];

  const memberRoster: Array<{
    name: string;
    gender: "Male" | "Female";
    status?: string;
    code?: string;
    streak?: number;
    best?: number;
  }> = [
    {
      name: "Sister Chioma Nwosu",
      gender: "Female",
      code: "CC-2024-0219",
      streak: 14,
      best: 14,
    },
    {
      name: "Elder Babatunde Bakare",
      gender: "Male",
      status: "NEEDS_FOLLOW_UP",
      code: "CC-2024-0087",
      streak: 0,
      best: 8,
    },
    {
      name: "Ngozi Eze",
      gender: "Female",
      status: "FIRST_TIME_GUEST",
      code: "CC-2024-0731",
      streak: 1,
      best: 1,
    },
    {
      name: "Femi Awolowo",
      gender: "Male",
      code: "CC-2024-0390",
      streak: 9,
      best: 11,
    },
    {
      name: "Deborah Adeleke",
      gender: "Female",
      status: "NEEDS_FOLLOW_UP",
      code: "CC-2024-0412",
      streak: 0,
      best: 5,
    },
    { name: "Grace Adebayo", gender: "Female" },
    { name: "Chinedu Okafor", gender: "Male" },
    { name: "Esther Oladipo", gender: "Female" },
    { name: "Funke Akindele", gender: "Female" },
    { name: "Daniel Mensah", gender: "Male" },
    { name: "Ruth Danjuma", gender: "Female" },
    { name: "Hannah Obi", gender: "Female" },
    { name: "Joshua Balogun", gender: "Male" },
    { name: "Miriam Lawal", gender: "Female" },
    { name: "Caleb Ibrahim", gender: "Male" },
    { name: "Solomon Kehinde", gender: "Male" },
    { name: "Abigail Alabi", gender: "Female" },
    { name: "Peter Nnamdi", gender: "Male" },
    { name: "Sarah Ogundipe", gender: "Female" },
    { name: "Paul Udo", gender: "Male" },
    { name: "Lydia Bello", gender: "Female" },
    { name: "Stephen Ajayi", gender: "Male" },
    { name: "Priscilla Obi", gender: "Female" },
    { name: "Naomi Fasanya", gender: "Female" },
  ];

  memberRoster.forEach((item, idx) => {
    const num = idx + 4;
    const rawPhone = `080000000${num.toString().padStart(2, "0")}`;
    const deptDoc = deptDocs[(idx + 1) % deptDocs.length];
    const actDoc = activityDocs[idx % activityDocs.length];
    const slug = item.name.toLowerCase().replace(/[^a-z]+/g, ".");

    accounts.push({
      fullName: item.name,
      phone: normalizePhoneNumber(rawPhone),
      email: `${slug}@churchconnect.ng`,
      gender: item.gender,
      role: "MEMBER",
      status: item.status ?? "ACTIVE",
      department: deptDoc.name,
      activities: [actDoc.name],
      departmentIds: [deptDoc._id],
      activityIds: [actDoc._id],
      memberCode: item.code ?? formatMemberCode(2026, num),
      notes: "Active parishioner in Grace Sanctuary Parish.",
      currentStreak: item.streak ?? (idx % 6) + 2,
      longestStreak: item.best ?? (idx % 8) + 5,
    });
  });

  const memberDocs: MemberDocument[] = [];
  for (const account of accounts) {
    const doc = await Member.findOneAndUpdate(
      { phone: account.phone },
      {
        $set: {
          ...account,
          passwordHash,
          consentAcceptedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );
    if (doc) {
      memberDocs.push(doc);
    }
  }

  // Seed 8 Sunday services (most recent OPEN, previous 7 CLOSED)
  const baseSunday = new Date("2026-11-01T08:00:00.000Z");
  const serviceDocs: ServiceDocument[] = [];
  for (let i = 0; i < 8; i++) {
    const serviceDateObj = new Date(baseSunday.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const serviceDate = serviceDateObj.toISOString().slice(0, 10);
    const name = `Sunday First Service (${serviceDate})`;
    const isLatest = i === 0;

    const serviceDoc = await Service.findOneAndUpdate(
      { serviceDate, serviceType: "SUNDAY" },
      {
        $set: {
          name,
          serviceType: "SUNDAY",
          serviceDate,
          startTime: "08:00 AM",
          location: "Main Sanctuary",
          usherStation: "Door A · Main Auditorium",
          status: isLatest ? "OPEN" : "CLOSED",
          qrSecret: generateServiceQrSecret(),
          openedAt: serviceDateObj,
          closedAt: isLatest ? null : new Date(serviceDateObj.getTime() + 3 * 60 * 60 * 1000),
        },
      },
      { upsert: true, new: true },
    );
    if (serviceDoc) {
      serviceDocs.push(serviceDoc);
    }
  }

  // Seed sample Attendance rows across the services
  let attendanceCount = 0;
  for (const serviceDoc of serviceDocs) {
    for (let mIdx = 0; mIdx < Math.min(memberDocs.length, 16); mIdx++) {
      const memberDoc = memberDocs[mIdx];
      await Attendance.findOneAndUpdate(
        { serviceId: serviceDoc._id, memberId: memberDoc._id },
        {
          $set: {
            serviceId: serviceDoc._id,
            memberId: memberDoc._id,
            markedById: null,
            method: mIdx % 4 === 0 ? "MANUAL" : "QR",
            status: "PRESENT",
            isGuest: false,
            guestName: null,
            guestPhone: null,
            notes: null,
            markedAt: new Date(
              (serviceDoc.openedAt ?? new Date()).getTime() + (mIdx + 2) * 60 * 1000,
            ),
          },
        },
        { upsert: true, new: true },
      );
      attendanceCount++;
    }
  }

  // Seed 4 active 7-day Service Photos on the latest service
  const latestService = serviceDocs[0];
  const adminMember = memberDocs.find((m) => m.role === "ADMIN") ?? memberDocs[0];
  let photoCount = 0;
  if (latestService && adminMember) {
    const now = new Date();
    const seedPhotos = [
      {
        caption: "Main Sanctuary Choir leading the opening praise anthem.",
        category: "Choir Ministration",
        storageKey: "seed/choir-ministration.jpg",
        imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80",
      },
      {
        caption: "Ushering & Protocol team welcoming families at Door A foyer.",
        category: "Foyer Fellowship",
        storageKey: "seed/foyer-fellowship.jpg",
        imageUrl: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1200&q=80",
      },
      {
        caption: "Youth Fellowship prayer circle after the benediction.",
        category: "Youth & Teens",
        storageKey: "seed/youth-prayer.jpg",
        imageUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&q=80",
      },
      {
        caption: "Sanctuary altar floral arrangement and morning light.",
        category: "Sanctuary Worship",
        storageKey: "seed/sanctuary-altar.jpg",
        imageUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80",
      },
    ];

    for (const item of seedPhotos) {
      await Photo.findOneAndUpdate(
        { storageKey: item.storageKey },
        {
          $set: {
            serviceId: latestService._id,
            uploadedById: adminMember._id,
            imageUrl: item.imageUrl,
            storageKey: item.storageKey,
            caption: item.caption,
            category: item.category,
            status: "APPROVED",
            uploadedAt: now,
            expiresAt: new Date(now.getTime() + SEVEN_DAYS_MS),
          },
        },
        { upsert: true, new: true },
      );
      photoCount++;
    }
  }

  console.log(
    `Seeded ${deptDocs.length} departments, ${activityDocs.length} activities, ${memberDocs.length} members, ${serviceDocs.length} Sunday services, ${attendanceCount} attendance records, and ${photoCount} active 7-day photos.`,
  );
  process.exit(0);
}

runSeed().catch((error: unknown) => {
  console.error("Failed to seed database:", error);
  process.exit(1);
});
