import type { ReactNode } from "react";

export interface MemberRowProps {
  name: string;
  department?: string;
  time?: string;
  isGuest?: boolean;
  rightSlot?: ReactNode;
}

export function MemberRow({
  name,
  department = "General Congregation",
  time,
  isGuest = false,
  rightSlot,
}: MemberRowProps): ReactNode {
  const initial = name.trim().charAt(0).toUpperCase() || "M";

  return (
    <div className="member-row p-space-sm bg-surface-container-lowest rounded-xl shadow-sm flex items-center justify-between gap-space-sm">
      <div className="member-info flex items-center gap-space-sm min-w-0">
        <div
          className="member-avatar w-10 h-10 rounded-full bg-primary-fixed text-on-primary-fixed font-bold flex items-center justify-center shrink-0 text-sm"
          aria-hidden="true"
        >
          {initial}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="member-name font-label-md text-label-md text-on-surface font-semibold truncate flex items-center gap-1.5">
            <span>{name}</span>
            {isGuest && (
              <span className="pill-warning px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-[11px]">
                Guest
              </span>
            )}
          </div>
          <div className="member-meta font-body-sm text-[12px] text-on-surface-variant truncate">
            {department}
          </div>
        </div>
      </div>

      <div className="row-actions flex items-center gap-2 shrink-0">
        {time && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-tertiary-container font-semibold font-label-sm text-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
            {time}
          </span>
        )}
        {rightSlot}
      </div>
    </div>
  );
}
