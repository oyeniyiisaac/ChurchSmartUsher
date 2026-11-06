import { NextResponse } from "next/server";
import { purgeExpiredPhotos } from "../../../../src/services/photo";

export async function POST(): Promise<NextResponse> {
  const result = await purgeExpiredPhotos(new Date());
  return NextResponse.json({
    ok: true,
    purgedAt: new Date().toISOString(),
    ...result,
  });
}

export async function GET(): Promise<NextResponse> {
  const result = await purgeExpiredPhotos(new Date());
  return NextResponse.json({
    ok: true,
    purgedAt: new Date().toISOString(),
    ...result,
  });
}
