"use client";

import { gql, useMutation } from "@apollo/client";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import { buildTaggedServiceName, computeServiceCalendarTag } from "@/services/service-tag";

const CREATE_TAGGED_SERVICE_MUTATION = gql`
  mutation CreateTaggedService($input: CreateServiceInput!) {
    createService(input: $input) {
      id
      name
      serviceTag
      sermonTopic
      serviceType
      serviceDate
      startTime
      location
      usherStation
      status
      openedAt
    }
  }
`;

export interface CreatedTaggedServiceInfo {
  id: string;
  name: string;
  serviceTag: string;
  sermonTopic: string;
  serviceType: string;
  serviceDate: string;
  startTime: string;
  location: string;
  usherStation: string;
  status: "SCHEDULED" | "OPEN" | "CLOSED";
}

export interface ServiceTagQrModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (service: CreatedTaggedServiceInfo) => void;
}

export function ServiceTagQrModal({ open, onClose, onCreated }: ServiceTagQrModalProps): ReactNode {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [serviceDate, setServiceDate] = useState<string>(todayIso);
  const [serviceType, setServiceType] = useState<"SUNDAY" | "MIDWEEK" | "SPECIAL">("SUNDAY");
  const [serviceTag, setServiceTag] = useState<string>(() =>
    computeServiceCalendarTag(todayIso, "SUNDAY"),
  );
  const [sermonTopic, setSermonTopic] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("8:00 AM");
  const [usherStation, setUsherStation] = useState<string>("Door A (Main Entrance)");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createServiceMutation, { loading }] = useMutation(CREATE_TAGGED_SERVICE_MUTATION);

  useEffect(() => {
    setServiceTag(computeServiceCalendarTag(serviceDate, serviceType));
  }, [serviceDate, serviceType]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMsg(null);

    const cleanTag = serviceTag.trim() || computeServiceCalendarTag(serviceDate, serviceType);
    const cleanTopic = sermonTopic.trim();
    const fullName = buildTaggedServiceName(cleanTag, cleanTopic);

    try {
      const res = await createServiceMutation({
        variables: {
          input: {
            name: fullName,
            serviceTag: cleanTag,
            sermonTopic: cleanTopic,
            serviceType,
            serviceDate,
            startTime: startTime.trim() || "8:00 AM",
            location: "RCCG JESUS HOUSE, OGBOMOSHO Auditorium",
            usherStation: usherStation.trim() || "Door A (Main Entrance)",
            openImmediately: true,
          },
        },
      });

      const created = res.data?.createService as CreatedTaggedServiceInfo | undefined;
      if (created) {
        onCreated?.(created);
        setSermonTopic("");
        onClose();
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Unable to create service. Ensure you are signed in as Usher or Admin.",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tagServiceModalTitle"
    >
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-xl border border-outline-variant/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
            </div>
            <div>
              <h3
                id="tagServiceModalTitle"
                className="font-headline-sm text-headline-sm text-primary font-bold"
              >
                Tag Service &amp; Generate New QR Code
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Auto-tags Sunday of the month &amp; year with the sermon topic
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-error-container text-on-error-container px-3.5 py-2.5 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="serviceDateInput"
                className="block font-label-sm text-label-sm font-semibold text-on-surface-variant mb-1"
              >
                Service Date *
              </label>
              <input
                id="serviceDateInput"
                type="date"
                required
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="serviceTypeSelect"
                className="block font-label-sm text-label-sm font-semibold text-on-surface-variant mb-1"
              >
                Service Cycle *
              </label>
              <select
                id="serviceTypeSelect"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as "SUNDAY" | "MIDWEEK" | "SPECIAL")}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="SUNDAY">Sunday Service</option>
                <option value="MIDWEEK">Midweek Study / Digging Deep</option>
                <option value="SPECIAL">Special / Thanksgiving Service</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="serviceCalendarTagInput"
              className="block font-label-sm text-label-sm font-semibold text-on-surface-variant mb-1"
            >
              Auto-Computed Calendar Tag (Week of Month &amp; Year) *
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px]">
                calendar_month
              </span>
              <input
                id="serviceCalendarTagInput"
                type="text"
                required
                value={serviceTag}
                onChange={(e) => setServiceTag(e.target.value)}
                placeholder="e.g. First Sunday of November 2026"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-secondary-fixed/30 border border-secondary/30 font-label-md text-label-md text-on-surface font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="sermonTopicInput"
              className="block font-label-sm text-label-sm font-semibold text-on-surface-variant mb-1"
            >
              Sunday Sermon Topic *
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-primary text-[18px]">
                menu_book
              </span>
              <input
                id="sermonTopicInput"
                type="text"
                required
                value={sermonTopic}
                onChange={(e) => setSermonTopic(e.target.value)}
                placeholder="e.g. Walking in Covenant Abundance"
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="serviceStartTimeInput"
                className="block font-label-sm text-label-sm font-semibold text-on-surface-variant mb-1"
              >
                Start Time
              </label>
              <input
                id="serviceStartTimeInput"
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="8:00 AM"
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface"
              />
            </div>
            <div>
              <label
                htmlFor="serviceStationInput"
                className="block font-label-sm text-label-sm font-semibold text-on-surface-variant mb-1"
              >
                Usher Station / Gate
              </label>
              <input
                id="serviceStationInput"
                type="text"
                value={usherStation}
                onChange={(e) => setUsherStation(e.target.value)}
                placeholder="Door A (Main Entrance)"
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface"
              />
            </div>
          </div>

          <div className="rounded-xl bg-surface-container-low p-3 text-left">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Live QR Preview Label:
            </p>
            <p className="font-label-md text-label-md text-primary font-bold mt-0.5">
              {buildTaggedServiceName(serviceTag, sermonTopic)}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md flex items-center gap-2 hover:bg-primary-container transition-colors cursor-pointer disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              <span>{loading ? "Generating QR..." : "Tag Service & Show New QR"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
