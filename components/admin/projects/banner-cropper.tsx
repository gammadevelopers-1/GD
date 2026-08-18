"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Move, ZoomIn } from "lucide-react";
import { BANNER_ASPECT, BANNER_OUTPUT_WIDTH } from "@/lib/projects/banner";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FOCUS_RING } from "@/lib/admin-ui";

const MAX_ZOOM = 4;

type Frame = { width: number; height: number };

function outputType(type: string) {
  if (type === "image/png") return "image/png";
  if (type === "image/webp") return "image/webp";
  return "image/jpeg";
}

function coverScale(frame: Frame, image: HTMLImageElement) {
  return Math.max(
    frame.width / image.naturalWidth,
    frame.height / image.naturalHeight,
  );
}

function clamp(value: number, limit: number) {
  return Math.min(limit, Math.max(-limit, value));
}

function limits(frame: Frame, image: HTMLImageElement, zoom: number) {
  const scale = coverScale(frame, image) * zoom;
  return {
    x: Math.max(0, (image.naturalWidth * scale - frame.width) / 2),
    y: Math.max(0, (image.naturalHeight * scale - frame.height) / 2),
  };
}

export function BannerCropper({
  file,
  saving,
  onCancel,
  onSave,
}: {
  file: File;
  saving: boolean;
  onCancel: () => void;
  onSave: (cropped: File) => void;
}) {
  const [url] = useState(() => URL.createObjectURL(file));
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [working, setWorking] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  useEffect(() => {
    const loaded = new Image();
    loaded.onload = () => setImage(loaded);
    loaded.src = url;
    return () => {
      loaded.onload = null;
      URL.revokeObjectURL(url);
    };
  }, [url]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  const frameSize = useCallback((): Frame | null => {
    const node = frameRef.current;
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, []);

  function startDrag(event: React.PointerEvent) {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }

  function moveDrag(event: React.PointerEvent) {
    const start = drag.current;
    const frame = frameSize();
    if (!start || !image || !frame) return;
    const bounds = limits(frame, image, zoom);
    setOffset({
      x: clamp(start.ox + (event.clientX - start.x), bounds.x),
      y: clamp(start.oy + (event.clientY - start.y), bounds.y),
    });
  }

  function endDrag(event: React.PointerEvent) {
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function changeZoom(next: number) {
    const frame = frameSize();
    if (!image || !frame) {
      setZoom(next);
      return;
    }
    const bounds = limits(frame, image, next);
    setZoom(next);
    setOffset((current) => ({
      x: clamp(current.x, bounds.x),
      y: clamp(current.y, bounds.y),
    }));
  }

  async function save() {
    const frame = frameSize();
    if (!image || !frame) return;
    setWorking(true);

    const scale = coverScale(frame, image) * zoom;
    const shownWidth = image.naturalWidth * scale;
    const shownHeight = image.naturalHeight * scale;

    let sx = (shownWidth - frame.width) / 2 - offset.x;
    let sy = (shownHeight - frame.height) / 2 - offset.y;
    let sw = frame.width;
    let sh = frame.height;

    sx = Math.max(0, sx / scale);
    sy = Math.max(0, sy / scale);
    sw = Math.min(sw / scale, image.naturalWidth - sx);
    sh = Math.min(sh / scale, image.naturalHeight - sy);

    const width = Math.min(BANNER_OUTPUT_WIDTH, Math.round(sw));
    const height = Math.round(width / BANNER_ASPECT);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const context = canvas.getContext("2d");
    if (!context) {
      setWorking(false);
      return;
    }
    context.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const type = outputType(file.type);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, 0.9),
    );
    setWorking(false);
    if (!blob) return;

    const extension =
      type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
    onSave(new File([blob], `banner.${extension}`, { type }));
  }

  const busy = saving || working;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop banner"
      className="fixed inset-0 z-50 grid place-items-center p-4"
    >
      <button
        aria-label="Cancel"
        onClick={onCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="card-surface relative w-full max-w-2xl rounded-2xl border border-black/[0.06] p-5">
        <h2 className="text-[15px] font-semibold tracking-[-0.025em]">
          Crop banner
        </h2>

        <div
          ref={frameRef}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`panel-dark relative mt-4 w-full touch-none overflow-hidden rounded-xl ${image ? "cursor-grab active:cursor-grabbing" : ""}`}
          style={{ aspectRatio: String(BANNER_ASPECT) }}
        >
          {url && image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url}
              alt=""
              draggable={false}
              className="absolute inset-0 size-full object-cover select-none"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            />
          ) : (
            <div className="grid size-full place-items-center">
              <Loader2 className="size-5 animate-spin text-white/40" />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="size-4 shrink-0 text-black/35" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            aria-label="Zoom"
            disabled={!image}
            onChange={(event) => changeZoom(Number(event.target.value))}
            className={`h-1.5 w-full cursor-pointer appearance-none rounded-full bg-black/[0.08] accent-[#16a34a] ${FOCUS_RING}`}
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={`${BUTTON_SECONDARY} h-10`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy || !image}
            className={`${BUTTON_PRIMARY} h-10`}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Save banner
          </button>
        </div>
      </div>
    </div>
  );
}
