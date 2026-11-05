"use client";

import { gql, useQuery } from "@apollo/client";

const PING_QUERY = gql`
  query PingCheck {
    ping {
      status
      timestamp
      version
    }
  }
`;

export default function HomePage() {
  const { data, loading, error, refetch } = useQuery(PING_QUERY);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          boxShadow: "0 8px 24px rgba(23, 53, 43, 0.06)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span
            style={{
              display: "inline-block",
              background: "var(--brand-soft)",
              color: "var(--brand)",
              fontWeight: 600,
              fontSize: "13px",
              padding: "4px 12px",
              borderRadius: "999px",
              marginBottom: "12px",
            }}
          >
            Slice 0 Verification
          </span>
          <h1
            style={{
              fontSize: "24px",
              color: "var(--ink)",
              margin: "0 0 8px",
              fontWeight: 700,
            }}
          >
            ChurchConnect Setup
          </h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "15px" }}>
            Next.js App Router + Apollo GraphQL unified setup
          </p>
        </div>

        <div
          style={{
            background: "var(--background)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-md)",
            padding: "20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{ fontWeight: 600, fontSize: "14px", marginBottom: "12px", color: "var(--ink)" }}
          >
            GraphQL Health Check
          </div>

          {loading && (
            <div style={{ color: "var(--muted)", fontSize: "14px" }}>Pinging /api/graphql...</div>
          )}

          {error && (
            <div
              style={{
                color: "var(--danger)",
                background: "#fde8e8",
                padding: "12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
              }}
            >
              Error connecting: {error.message}
            </div>
          )}

          {data?.ping && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "var(--muted)" }}>Status:</span>
                <span style={{ color: "var(--brand)", fontWeight: 600 }}>
                  ● {data.ping.status.toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "var(--muted)" }}>Version:</span>
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>v{data.ping.version}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                <span style={{ color: "var(--muted)" }}>Server Timestamp:</span>
                <span style={{ color: "var(--ink)", fontSize: "13px" }}>{data.ping.timestamp}</span>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => refetch()}
          style={{
            width: "100%",
            minHeight: "48px",
            background: "var(--brand)",
            color: "#ffffff",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
        >
          Re-check GraphQL Ping
        </button>
      </div>
    </main>
  );
}
