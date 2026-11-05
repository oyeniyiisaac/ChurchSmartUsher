export type StreakCardProps = {
  currentStreak: number;
  longestStreak: number;
  className?: string;
};

export function StreakCard({ currentStreak, longestStreak, className = "" }: StreakCardProps) {
  const getBadgeMessage = (streak: number) => {
    if (streak >= 52) return "52 Weeks Faithful — Pillar of the House";
    if (streak >= 12) return "12 Weeks Faithful — Steady Believer";
    if (streak >= 4) return "4 Weeks Faithful — Building Momentum";
    return "Keep showing up, one service at a time.";
  };

  return (
    <section
      className={`card streak-card ${className}`.trim()}
      aria-label="Attendance consistency streak"
    >
      <div>
        <span
          style={{
            display: "inline-block",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#f6ca57",
            marginBottom: "6px",
          }}
        >
          Consistency Streak
        </span>
        <h2 style={{ color: "#ffffff", fontSize: "1.35rem", margin: "0 0 6px" }}>
          {currentStreak} {currentStreak === 1 ? "Service" : "Services"} in a row
        </h2>
        <p style={{ margin: "0 0 4px", color: "#c8e3d3", fontSize: "0.95rem" }}>
          {getBadgeMessage(currentStreak)}
        </p>
        <p style={{ margin: 0, color: "#9fcbb2", fontSize: "0.85rem" }}>
          Personal best: {longestStreak} consecutive services
        </p>
      </div>
      <strong className="streak-number" aria-label={`Current streak: ${currentStreak}`}>
        {currentStreak}
      </strong>
    </section>
  );
}
