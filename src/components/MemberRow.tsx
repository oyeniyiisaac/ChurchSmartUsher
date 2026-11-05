export type MemberRowProps = {
  name: string;
  department: string;
  time: string;
  avatarUrl?: string;
  isGuest?: boolean;
  isManual?: boolean;
};

export function MemberRow({
  name,
  department,
  time,
  avatarUrl,
  isGuest = false,
  isManual = false,
}: MemberRowProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="member-row" style={{ justifyContent: "space-between", padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div className="member-avatar" aria-hidden="true">
            {initial}
          </div>
        )}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <strong style={{ fontSize: "15px", color: "var(--ink)" }}>{name}</strong>
            {isGuest && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "#e8f4fc",
                  color: "#1d6f9a",
                }}
              >
                Guest
              </span>
            )}
            {isManual && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: "#fff3c4",
                  color: "#806b19",
                }}
              >
                Manual
              </span>
            )}
          </div>
          <span style={{ fontSize: "13px", color: "var(--muted)", marginTop: "2px" }}>
            {department || "General Assembly"} · {time}
          </span>
        </div>
      </div>
      <span
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "var(--brand)",
          display: "inline-block",
        }}
        title="Present"
        aria-label="Present indicator"
      />
    </div>
  );
}
