import { hashPassword } from "../src/auth/password";
import {
  Activity,
  type ActivityDocument,
  Department,
  type DepartmentDocument,
  Member,
  Service,
  type UserRole,
} from "../src/db/models";
import { connectToDatabase } from "../src/db/mongoose";
import { formatMemberCode } from "../src/services/profile";
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

  for (const account of accounts) {
    await Member.findOneAndUpdate(
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
  }

  // Seed 8 closed Sunday services
  const baseSunday = new Date("2026-11-01T08:00:00.000Z");
  for (let i = 0; i < 8; i++) {
    const serviceDateObj = new Date(baseSunday.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const serviceDate = serviceDateObj.toISOString().slice(0, 10);
    const name = `Sunday First Service (${serviceDate})`;

    await Service.findOneAndUpdate(
      { serviceDate, serviceType: "SUNDAY" },
      {
        $set: {
          name,
          serviceType: "SUNDAY",
          serviceDate,
          status: "CLOSED",
          openedAt: serviceDateObj,
          closedAt: new Date(serviceDateObj.getTime() + 3 * 60 * 60 * 1000),
        },
      },
      { upsert: true, new: true },
    );
  }

  console.log(
    `Seeded ${deptDocs.length} departments, ${activityDocs.length} activities, ${accounts.length} members, and 8 Sunday services.`,
  );
  process.exit(0);
}

runSeed().catch((error: unknown) => {
  console.error("Failed to seed database:", error);
  process.exit(1);
});
