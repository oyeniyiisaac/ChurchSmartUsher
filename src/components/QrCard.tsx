"use client";

import { gql, useQuery } from "@apollo/client";
import { QRCodeSVG } from "qrcode.react";

export type QrCardProps = {
  serviceId?: string;
  serviceName: string;
  expiresInSeconds?: number;
  staticToken?: string;
};

const SERVICE_QR_QUERY = gql`
  query ServiceQrToken($id: ID!) {
    serviceQrToken(id: $id)
  }
`;

export function QrCard({
  serviceId,
  serviceName,
  expiresInSeconds = 60,
  staticToken,
}: QrCardProps) {
  const { data } = useQuery(SERVICE_QR_QUERY, {
    variables: { id: serviceId ?? "" },
    skip: !serviceId || Boolean(staticToken),
    pollInterval: 30_000,
  });

  const token = staticToken ?? data?.serviceQrToken;
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const checkinUrl =
    token && serviceId && origin
      ? `${origin}/checkin/${encodeURIComponent(serviceId)}?t=${encodeURIComponent(token)}`
      : "";

  return (
    <section className="card qr-card" aria-label={`${serviceName} service QR code`}>
      <div>
        <p className="eyebrow" style={{ marginBottom: "6px" }}>
          Usher Screen Display
        </p>
        <h2 style={{ fontSize: "1.35rem", color: "var(--ink)", margin: 0 }}>{serviceName}</h2>
        <p style={{ fontSize: "14px", color: "var(--muted)", margin: "4px 0 0" }}>
          Members: scan with your phone camera
        </p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
          background: "#ffffff",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--line)",
          maxWidth: "220px",
          margin: "0 auto",
        }}
      >
        {checkinUrl ? (
          <QRCodeSVG
            value={checkinUrl}
            size={180}
            level="M"
            aria-label={`QR code for ${serviceName}`}
          />
        ) : (
          <div
            className="qr-placeholder"
            style={{ width: "180px", height: "180px" }}
            aria-label="QR Code initializing"
          >
            Awaiting Open Service
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--brand)",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: "13px", color: "var(--muted)" }}>
          Rotates automatically (~{expiresInSeconds}s)
        </span>
      </div>
    </section>
  );
}
