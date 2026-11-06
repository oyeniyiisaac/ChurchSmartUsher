import type { ReactNode } from "react";

export interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  label?: string;
}

export function StreakCard({
  currentStreak,
  longestStreak,
  label = "Attendance Streak",
}: StreakCardProps): ReactNode {
  return (
    <section className="streak-card w-full bg-surface-container-lowest rounded-xl shadow-md p-space-md flex flex-col space-y-space-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-sm shrink-0">
            <span
              className="material-symbols-outlined text-[22px] material-icon-filled"
              aria-hidden="true"
            >
              local_fire_department
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {currentStreak} Sundays in a row
            </span>
            <span className="font-label-sm text-label-sm text-secondary font-medium">
              {label} · Faithful Worshipper Level
            </span>
          </div>
        </div>
        <span
          className="material-symbols-outlined text-secondary-container text-[28px] material-icon-filled"
          aria-hidden="true"
        >
          military_tech
        </span>
      </div>

      <div className="px-space-sm py-2 rounded-md bg-surface-container text-on-surface">
        <p className="font-body-sm text-body-sm italic text-center">
          “Consistent in fellowship, prayer, and uplifting worship.”
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        <div className="bg-surface-container-low rounded-lg p-2 flex flex-col items-center">
          <span className="font-headline-md text-headline-md font-bold text-primary">
            {currentStreak}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight mt-0.5">
            Current Streak
          </span>
        </div>
        <div className="bg-surface-container-low rounded-lg p-2 flex flex-col items-center">
          <span className="font-headline-md text-headline-md font-bold text-secondary">
            {longestStreak}
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight mt-0.5">
            Best Streak
          </span>
        </div>
        <div className="bg-surface-container-low rounded-lg p-2 flex flex-col items-center">
          <span className="font-headline-md text-headline-md font-bold text-tertiary-container">
            3/4
          </span>
          <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight mt-0.5">
            This Month
          </span>
        </div>
      </div>

      <p className="font-label-sm text-label-sm text-on-surface-variant text-right">
        Personal best: {longestStreak} consecutive services
      </p>
    </section>
  );
}
