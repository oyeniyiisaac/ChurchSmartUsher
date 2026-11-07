import {
  Activity,
  Attendance,
  Department,
  Member,
  ParishSettingsModel,
  Photo,
  Service,
} from "../src/db/models";
import { connectToDatabase } from "../src/db/mongoose";

async function runCleanSetup(): Promise<void> {
  await connectToDatabase();

  await Promise.all([
    Member.deleteMany({}),
    Department.deleteMany({}),
    Activity.deleteMany({}),
    Service.deleteMany({}),
    Attendance.deleteMany({}),
    Photo.deleteMany({}),
  ]);

  await ParishSettingsModel.findOneAndUpdate(
    { singletonKey: "PARISH_SETTINGS" },
    {
      $set: {
        singletonKey: "PARISH_SETTINGS",
        parishName: "RCCG JESUS HOUSE, OGBOMOSHO",
        denomination: "Redeemed Christian Church of God (RCCG)",
        qrRotationSeconds: 45,
        geofenceEnabled: true,
        childMinorShieldEnabled: true,
        compressionProfile: "Lagos Mobile Mesh: WebP Lossy (85% Quality)",
        autoPurgeDays: 7,
      },
    },
    { upsert: true, new: true },
  );

  console.log(
    "Cleared all collections and initialized parish settings for RCCG JESUS HOUSE, OGBOMOSHO.",
  );
  process.exit(0);
}

runCleanSetup().catch((error: unknown) => {
  console.error("Failed to initialize database:", error);
  process.exit(1);
});
