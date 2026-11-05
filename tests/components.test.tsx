import { MockedProvider } from "@apollo/client/testing";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { MemberRow } from "@/components/MemberRow";
import { QrCard } from "@/components/QrCard";
import { StreakCard } from "@/components/StreakCard";

describe("Shared UI Foundation Components", () => {
  it("renders Button variants with correct classes", () => {
    const primaryHtml = renderToString(<Button variant="primary">Confirm</Button>);
    expect(primaryHtml).toContain("button");

    const presentHtml = renderToString(<Button variant="present">Present</Button>);
    expect(presentHtml).toContain("button-present");

    const dangerHtml = renderToString(<Button variant="danger">Delete</Button>);
    expect(dangerHtml).toContain("button-danger");

    const loadingHtml = renderToString(<Button isLoading>Submit</Button>);
    expect(loadingHtml).toContain('aria-busy="true"');
    expect(loadingHtml).toContain("Loading...");
  });

  it("renders Card container with content", () => {
    const cardHtml = renderToString(
      <Card>
        <h2>Test Card</h2>
      </Card>,
    );
    expect(cardHtml).toContain("card");
    expect(cardHtml).toContain("Test Card");
  });

  it("renders StreakCard with current and longest streaks", () => {
    const streakHtml = renderToString(<StreakCard currentStreak={8} longestStreak={12} />);
    expect(streakHtml).toContain("streak-card");
    expect(streakHtml).toContain("8");
    expect(streakHtml).toContain("Personal best:");
    expect(streakHtml).toContain("12");
    expect(streakHtml).toContain("consecutive services");
  });

  it("renders MemberRow with avatar initial, department and status indicators", () => {
    const rowHtml = renderToString(
      <MemberRow name="Grace Adebayo" department="Choir" time="09:15 AM" isGuest />,
    );
    expect(rowHtml).toContain("Grace Adebayo");
    expect(rowHtml).toContain("Choir");
    expect(rowHtml).toContain("09:15 AM");
    expect(rowHtml).toContain("G"); // initial
    expect(rowHtml).toContain("Guest");
  });

  it("renders Input with label, helperText, and accessible error state", () => {
    const inputHtml = renderToString(
      <Input
        label="Phone Number"
        placeholder="08000000000"
        error="Invalid phone number"
        helperText="Enter 11 digits"
      />,
    );
    expect(inputHtml).toContain("Phone Number");
    expect(inputHtml).toContain('role="alert"');
    expect(inputHtml).toContain("Invalid phone number");
    expect(inputHtml).toContain('aria-invalid="true"');
  });

  it("renders QrCard with static token and QR elements", () => {
    const qrHtml = renderToString(
      <MockedProvider mocks={[]}>
        <QrCard
          serviceId="srv_1"
          serviceName="Sunday First Service"
          expiresInSeconds={60}
          staticToken="test-token"
        />
      </MockedProvider>,
    );
    expect(qrHtml).toContain("Sunday First Service");
    expect(qrHtml).toContain("qr-card");
    expect(qrHtml).toContain("Members: scan with your phone camera");
  });
});
