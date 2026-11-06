import { hashPassword } from "../src/auth/password";
import { Member, Service, type UserRole } from "../src/db/models";
import { connectToDatabase } from "../src/db/mongoose";
import { normalizePhoneNumber } from "../src/services/validation";

const DEFAULT_PASSWORD = "ChangeMe123!";

const DEPARTMENTS = [
  "Choir",
  "Ushering Unit",
  "Media & Technical",
  "Children Ministry",
  "Youth Fellowship",
  "General Assembly",
];

const ACTIVITIES = [
  "Sunday School",
  "Midweek Bible Study",
  "Prayer Band",
  "Choir Rehearsal",
  "Evangelism Outreach",
];

async function runSeed(): Promise<void> {
  await connectToDatabase();
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);

  const accounts: Array<{
    fullName: string;
    phone: string;
    role: UserRole;
    department: string;
    activities: string[];
    memberCode: string;
    currentStreak: number;
    longestStreak: number;
  }> = [
    {
      fullName: "Pastor Adewale Ogunleye (Admin)",
      phone: normalizePhoneNumber("08000000001"),
      role: "ADMIN",
      department: "Church Office",
      activities: ["Sunday School", "Midweek Bible Study"],
      memberCode: "CC-ADMIN-01",
      currentStreak: 8,
      longestStreak: 12,
    },
    {
      fullName: "Deacon Samuel Okon (Usher)",
      phone: normalizePhoneNumber("08000000002"),
      role: "USHER",
      department: "Ushering Unit",
      activities: ["Sunday School", "Prayer Band"],
      memberCode: "CC-USHER-01",
      currentStreak: 6,
      longestStreak: 10,
    },
  ];

  const memberNames = [
    "Isaac Oyeniyi",
    "Grace Adebayo",
    "Chinedu Okafor",
    "Blessing Nwosu",
    "Tunde Bakare",
    "Esther Oladipo",
    "Emeka Eze",
    "Funke Akindele",
    "Daniel Mensah",
    "Ruth Danjuma",
    "David Adeleke",
    "Hannah Obi",
    "Joshua Balogun",
    "Miriam Lawal",
    "Caleb Ibrahim",
    "Deborah Taiwo",
    "Solomon Kehinde",
    "Abigail Alabi",
    "Peter Nnamdi",
    "Sarah Ogundipe",
    "Paul Udo",
    "Lydia Bello",
    "Stephen Ajayi",
    "Priscillachukwu Obi",
    "Naomi Fasanya",
  ];

  memberNames.forEach((fullName, idx) => {
    const num = idx + 3;
    const rawPhone = `080000000${num.toString().padStart(2, "0")}`;
    accounts.push({
      fullName,
      phone: normalizePhoneNumber(rawPhone),
      role: "MEMBER",
      department: DEPARTMENTS[idx % DEPARTMENTS.length],
      activities: [ACTIVITIES[idx % ACTIVITIES.length]],
      memberCode: `CC-${(idx + 1).toString().padStart(4, "0")}`,
      currentStreak: (idx % 6) + 1,
      longestStreak: (idx % 8) + 3,
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
    `Seeded ${accounts.length} accounts (1 Admin, 1 Usher, 25 Members) and 8 closed Sunday services.`,
  );
  process.exit(0);
}

runSeed().catch((error: unknown) => {
  console.error("Failed to seed database:", error);
  process.exit(1);
});
