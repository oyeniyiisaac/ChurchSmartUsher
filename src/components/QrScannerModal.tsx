"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from "react";

export interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  fallbackCheckinPath?: string;
  activeServiceName?: string;
  activeServiceTag?: string;
  activeSermonTopic?: string;
}

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement | HTMLImageElement | ImageBitmap): Promise<
    Array<{
      rawValue?: string;
    }>
  >;
}

type WindowWithBarcodeDetector = Window & {
  BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
};

function extractCheckinDestination(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/checkin/")) {
    return trimmed;
  }

  try {
    const parsedUrl = new URL(trimmed);
    if (parsedUrl.pathname.startsWith("/checkin/")) {
      return `${parsedUrl.pathname}${parsedUrl.search}`;
    }
  } catch {
    // Not a full URL; check if it contains a /checkin/ substring
    const idx = trimmed.indexOf("/checkin/");
    if (idx !== -1) {
      return trimmed.slice(idx);
    }
  }

  return null;
}

export function QrScannerModal({
  open,
  onClose,
  fallbackCheckinPath = "/checkin/65f000000000000000000100?t=preview",
  activeServiceName,
  activeServiceTag,
  activeSermonTopic,
}: QrScannerModalProps): ReactNode {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [cameraState, setCameraState] = useState<"starting" | "active" | "error">("starting");
  const [statusMessage, setStatusMessage] = useState<string>(
    "Point your camera at the church QR code...",
  );
  const [detectedValue, setDetectedValue] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let cancelled = false;
    let scanInterval: number | undefined;

    async function startCamera(): Promise<void> {
      setCameraState("starting");
      setStatusMessage("Opening camera to scan QR code...");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setCameraState("error");
          setStatusMessage(
            "Camera API unavailable on this browser. Use photo capture or direct check-in below.",
          );
        }
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });

        if (cancelled) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => undefined);
        }

        setCameraState("active");
        setStatusMessage("Camera active — align QR code inside frame");

        const DetectorClass = (window as unknown as WindowWithBarcodeDetector).BarcodeDetector;
        if (DetectorClass) {
          const detector = new DetectorClass({ formats: ["qr_code"] });
          scanInterval = window.setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              const firstRaw = barcodes[0]?.rawValue;
              if (firstRaw) {
                const destination = extractCheckinDestination(firstRaw) ?? fallbackCheckinPath;
                setDetectedValue(destination);
                setStatusMessage("QR Code Verified! Redirecting to check-in...");
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((track) => track.stop());
                  streamRef.current = null;
                }
                window.clearInterval(scanInterval);
                onClose();
                router.push(destination);
              }
            } catch {
              // Continue scanning next frame
            }
          }, 350);
        }
      } catch {
        if (!cancelled) {
          setCameraState("error");
          setStatusMessage(
            "Camera permission was blocked or no camera was found. You can capture a QR photo or proceed below.",
          );
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      if (scanInterval) {
        window.clearInterval(scanInterval);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [open, facingMode, fallbackCheckinPath, onClose, router]);

  async function handleQrImageCapture(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatusMessage("Analyzing captured QR image...");
    try {
      const DetectorClass = (window as unknown as WindowWithBarcodeDetector).BarcodeDetector;
      if (DetectorClass && typeof createImageBitmap === "function") {
        const bitmap = await createImageBitmap(file);
        const detector = new DetectorClass({ formats: ["qr_code"] });
        const barcodes = await detector.detect(bitmap);
        const raw = barcodes[0]?.rawValue;
        if (raw) {
          const dest = extractCheckinDestination(raw) ?? fallbackCheckinPath;
          onClose();
          router.push(dest);
          return;
        }
      }
    } catch {
      // Fallback to active service check-in path
    }

    onClose();
    router.push(fallbackCheckinPath);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-margin"
      id="cameraModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qrScannerModalTitle"
    >
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-xl p-space-lg flex flex-col items-center text-center space-y-space-md">
        <div className="w-14 h-14 rounded-full bg-secondary-fixed/50 flex items-center justify-center text-secondary">
          <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
        </div>

        <div>
          <h4
            id="qrScannerModalTitle"
            className="font-headline-sm text-headline-sm text-on-surface font-bold"
          >
            Scanning Entrance Code
          </h4>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Align the screen with the church usher display kiosk at the sanctuary doors.
          </p>
          {(activeServiceTag || activeServiceName) && (
            <div className="mt-2 inline-flex flex-col items-center px-3 py-1 rounded-lg bg-surface-container-low text-on-surface">
              <span className="font-label-sm text-label-sm text-primary font-bold">
                {activeServiceTag || activeServiceName}
              </span>
              {activeSermonTopic && (
                <span className="text-[11px] text-secondary font-medium">
                  Topic: “{activeSermonTopic}”
                </span>
              )}
            </div>
          )}
        </div>

        {/* Live Camera Feed Frame */}
        <div className="w-full aspect-square max-w-[240px] rounded-xl bg-[#0b132b] flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraState === "active" ? "opacity-100" : "opacity-25"}`}
          />

          {/* Dashed Viewfinder Frame */}
          <div className="absolute inset-3 border-2 border-dashed border-secondary/80 rounded-lg pointer-events-none" />

          {/* Animated Laser Scan Line when camera is active */}
          {cameraState === "active" && (
            <div className="absolute inset-x-4 top-1/2 h-0.5 bg-secondary shadow-[0_0_12px_2px_rgba(254,147,44,0.85)] animate-pulse pointer-events-none" />
          )}

          {/* Overlay message when starting or error */}
          {cameraState !== "active" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
              <span className="material-symbols-outlined text-[42px] text-secondary-fixed animate-pulse">
                {cameraState === "starting" ? "photo_camera" : "videocam_off"}
              </span>
              <span className="font-label-sm text-label-sm text-white/90 mt-2 leading-snug">
                {statusMessage}
              </span>
            </div>
          )}

          {/* Camera Flip Button */}
          {cameraState === "active" && (
            <button
              type="button"
              onClick={() =>
                setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
              }
              title="Switch Front / Back Camera"
              className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">cameraswitch</span>
            </button>
          )}

          {/* Live Status Pill */}
          {cameraState === "active" && (
            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim animate-ping" />
              <span>{detectedValue ? "QR Detected!" : "Live Camera"}</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void handleQrImageCapture(e)}
        />

        <div className="w-full flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 w-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 px-3 bg-surface-container-low hover:bg-surface-container text-primary rounded-lg font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
              <span>Snap QR Photo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(fallbackCheckinPath);
              }}
              className="h-10 px-3 bg-primary-container hover:bg-primary text-on-primary rounded-lg font-label-sm text-label-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Instant Check-In</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 bg-surface-container text-on-surface rounded-lg font-label-md text-label-md cursor-pointer hover:bg-surface-container-high transition-colors"
            id="closeCameraBtn"
          >
            Cancel Scan
          </button>
        </div>
      </div>
    </div>
  );
}
