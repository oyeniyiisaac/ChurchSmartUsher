"use client";

import { useState } from "react";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { MemberRow } from "@/components/MemberRow";
import { QrCard } from "@/components/QrCard";
import { StreakCard } from "@/components/StreakCard";

export default function DesignSystemPage() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [demoInput, setDemoInput] = useState("08012345678");
  const [demoError, setDemoError] = useState("");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
      {/* Header section */}
      <div>
        <p className="eyebrow">Slice 0.5 — UI Foundation</p>
        <h1 style={{ fontSize: "2rem", margin: "0 0 8px", color: "var(--ink)", fontWeight: 700 }}>
          Stitch Design System & Shared Components
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "16px", maxWidth: "640px" }}>
          Interactive foundation displaying design tokens, typography, and reusable component
          primitives built to meet mobile-first church check-in accessibility criteria.
        </p>
      </div>

      {/* 1. Design Tokens Palette */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", color: "var(--ink)" }}>
          1. Color Palette & Tokens
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            { name: "Brand Primary", hex: "#1d614b", text: "#ffffff", varName: "--brand" },
            { name: "Brand Dark", hex: "#0e3c2d", text: "#ffffff", varName: "--brand-dark" },
            { name: "Brand Soft", hex: "#e0eee4", text: "#17352b", varName: "--brand-soft" },
            { name: "Accent Gold", hex: "#d8a82e", text: "#17352b", varName: "--accent" },
            { name: "Surface Cream", hex: "#fffefa", text: "#17352b", varName: "--surface" },
            {
              name: "Background Offwhite",
              hex: "#f5f7f2",
              text: "#17352b",
              varName: "--background",
            },
            { name: "Ink Primary", hex: "#17352b", text: "#ffffff", varName: "--ink" },
            { name: "Danger Red", hex: "#b42318", text: "#ffffff", varName: "--danger" },
          ].map((token) => (
            <div
              key={token.name}
              style={{
                background: token.hex,
                color: token.text,
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--line)",
                minHeight: "100px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <strong style={{ fontSize: "14px" }}>{token.name}</strong>
              <div style={{ fontSize: "12px", opacity: 0.9 }}>
                <code>{token.hex}</code>
                <br />
                <span style={{ fontSize: "10px" }}>{token.varName}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Button Primitives */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", color: "var(--ink)" }}>
          2. Buttons & Tap Targets (≥48px, Present ≥56px)
        </h2>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--muted)",
                }}
              >
                Core Check-in & Action Buttons
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                <Button variant="primary">Primary Action (48px)</Button>
                <Button variant="secondary">Secondary Action (48px)</Button>
                <Button variant="ghost">Ghost Button (48px)</Button>
                <Button variant="danger">Danger Action (48px)</Button>
                <Button
                  variant="primary"
                  isLoading={btnLoading}
                  onClick={() => {
                    setBtnLoading(true);
                    setTimeout(() => setBtnLoading(false), 2000);
                  }}
                >
                  {btnLoading ? "Processing" : "Click for Loading State"}
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--muted)",
                }}
              >
                Main Check-in Present Button (Full Width, 56px Target)
              </p>
              <Button variant="present">Present — Confirm My Attendance</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Form Input Primitives */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", color: "var(--ink)" }}>
          3. Input Components (≥16px Font Size, Mobile Safe)
        </h2>
        <Card>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            <Input
              label="Member Phone Number"
              placeholder="e.g. 08012345678"
              value={demoInput}
              onChange={(e) => {
                setDemoInput(e.target.value);
                if (e.target.value.length < 11) {
                  setDemoError("Phone number must have at least 11 digits");
                } else {
                  setDemoError("");
                }
              }}
              helperText="Normalized automatically to +234"
              error={demoError}
            />

            <Input
              label="Full Name"
              placeholder="Isaac Oyeniyi"
              defaultValue="Isaac Oyeniyi"
              helperText="As registered in the church roll"
            />

            <Input
              label="Read-only Church ID"
              defaultValue="CH-2026-0042"
              disabled
              helperText="System assigned ID"
            />
          </div>
        </Card>
      </section>

      {/* 4. Attendance Components */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", color: "var(--ink)" }}>
          4. Attendance & Usher Primitives
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Consistency Streak Card */}
          <StreakCard currentStreak={7} longestStreak={14} />

          {/* Usher Service QR Card */}
          <QrCard
            serviceId="srv_sun_first_101"
            serviceName="Sunday First Service"
            expiresInSeconds={48}
            staticToken="demo-hmac-signed-token-slot-20261106"
          />
        </div>
      </section>

      {/* 5. Live Feed Member Rows */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", color: "var(--ink)" }}>
          5. Live Attendance Feed List (`MemberRow`)
        </h2>
        <Card>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <MemberRow name="Pastor David Adeleke" department="Pastoral Team" time="08:42 AM" />
            <div style={{ borderTop: "1px solid var(--line)" }} />
            <MemberRow name="Sister Grace Johnson" department="Choir" time="08:46 AM" />
            <div style={{ borderTop: "1px solid var(--line)" }} />
            <MemberRow
              name="Brother Samuel Okon"
              department="Ushering Unit"
              time="08:49 AM"
              isManual
            />
            <div style={{ borderTop: "1px solid var(--line)" }} />
            <MemberRow
              name="Olumide Bakare"
              department="First-time Visitor"
              time="08:52 AM"
              isGuest
            />
          </div>
        </Card>
      </section>
    </div>
  );
}
