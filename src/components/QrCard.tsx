"use client";

import { gql, useQuery } from "@apollo/client";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, type ReactNode } from "react";

const SERVICE_QR_QUERY = gql`
  query ServiceQr($serviceId: ID!) {
    serviceQr(serviceId: $serviceId) {
      serviceId
      token
      checkinUrl
      slot
      expiresInSeconds
    }
  }
`;

export interface QrCardProps {
  serviceId: string;
  serviceName: string;
  initialToken?: string;
  expiresInSeconds?: number;
  staticToken?: string;
}

interface ServiceQrQueryData {
  serviceQr?: {
    serviceId: string;
    token: string;
    checkinUrl: string;
    slot: number;
    expiresInSeconds: number;
  };
}

export function QrCard({
  serviceId,
  serviceName,
  initialToken = "loading-token",
  expiresInSeconds = 60,
  staticToken,
}: QrCardProps): ReactNode {
  const { data, refetch } = useQuery<ServiceQrQueryData>(SERVICE_QR_QUERY, {
    variables: { serviceId },
    skip: Boolean(staticToken) || typeof window === "undefined",
    pollInterval: 30000,
    fetchPolicy: "network-only",
  });

  const [secondsLeft, setSecondsLeft] = useState<number>(expiresInSeconds);
  const [origin, setOrigin] = useState<string>("");

  const activeToken = staticToken ?? data?.serviceQr?.token ?? initialToken;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (data?.serviceQr?.expiresInSeconds) {
      setSecondsLeft(data.serviceQr.expiresInSeconds);
    }
  }, [data?.serviceQr?.expiresInSeconds]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!staticToken) {
            void refetch();
          }
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [refetch, staticToken]);

  const checkinPath = `/checkin/${serviceId}?t=${encodeURIComponent(activeToken)}`;
  const fullUrl = data?.serviceQr?.checkinUrl ?? (origin ? `${origin}${checkinPath}` : checkinPath);

  return (
    <div className="qr-card w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-md flex flex-col items-center text-center">
      <div className="flex items-center justify-center gap-2 mb-space-md px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-secondary">timer</span>
        <span className="font-label-sm text-label-sm font-semibold">
          {serviceName} · Code refreshes in {secondsLeft}s
        </span>
        <div className="w-3 h-3 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
      </div>

      <div
        className="qr-frame relative p-space-md bg-surface-container-lowest rounded-xl shadow-inner flex items-center justify-center"
        aria-label={`Check-in QR code for ${serviceName}`}
      >
        <QRCodeSVG value={fullUrl} size={240} level="M" bgColor="#FFFFFF" fgColor="#00236f" />
        <span className="absolute top-2 left-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
        </span>
      </div>

      <div className="mt-space-md px-space-xs">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
          Members: scan with your phone camera
        </h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Instant check-in confirms your seat &amp; updates your fellowship streak
        </p>
      </div>

      <div className="mt-space-sm flex items-center justify-center gap-1.5 text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px] text-tertiary">verified_user</span>
        <span className="font-label-sm text-label-sm">
          Dynamic door-sync enabled · Anti-tamper token active
        </span>
      </div>
    </div>
  );
}
