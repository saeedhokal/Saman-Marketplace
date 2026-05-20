import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { retryObjectImg } from "@/lib/bustObjectUrl";

function getFullscreenImageUrl(src: string): string {
  if (!src) return src;
  if (src.startsWith("/objects/")) {
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}w=1400&q=80`;
  }
  return src;
}

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
}

export function ImageGallery({ images, initialIndex = 0 }: ImageGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialIndex,
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    duration: 22,
  });
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(images.length - 1, currentIndex + 2);
    for (let i = start; i <= end; i++) {
      const preload = new Image();
      preload.src = images[i];
    }
  }, [currentIndex, images]);

  const scrollTo = useCallback((idx: number) => {
    emblaApi?.scrollTo(idx);
  }, [emblaApi]);

  const goPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const goNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = Math.abs(e.clientX - dragStartRef.current.x);
    const dy = Math.abs(e.clientY - dragStartRef.current.y);
    if (dx > 6 || dy > 6) didDragRef.current = true;
  }, []);

  const handleClick = useCallback(() => {
    if (didDragRef.current) return;
    setIsFullscreen(true);
  }, []);

  if (images.length === 0) return null;

  return (
    <div dir="ltr">
      <div className="relative">
        <div
          className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary/30 shadow-md cursor-pointer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onClick={handleClick}
          data-testid="image-gallery-main"
        >
          <div ref={emblaRef} className="overflow-hidden h-full">
            <div className="flex h-full touch-pan-y">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative flex-[0_0_100%] min-w-0 h-full"
                  data-testid={`gallery-slide-${idx}`}
                >
                  <img
                    src={img}
                    alt={`Image ${idx + 1}`}
                    loading={idx < 2 ? "eager" : "lazy"}
                    decoding="async"
                    onError={retryObjectImg}
                    draggable={false}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {images.length > 1 && (
            <>
              {currentIndex > 0 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm h-8 w-8 z-10"
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  data-testid="button-prev-image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {currentIndex < images.length - 1 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm h-8 w-8 z-10"
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  data-testid="button-next-image"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); scrollTo(idx); }}
                    className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? "bg-white w-4" : "bg-white/60 w-1.5"}`}
                    data-testid={`dot-indicator-${idx}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${idx === currentIndex ? "border-accent" : "border-transparent"}`}
              data-testid={`thumbnail-${idx}`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" decoding="async" onError={retryObjectImg} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {isFullscreen && createPortal(
        <FullscreenViewer
          images={images}
          initialIndex={currentIndex}
          onClose={() => setIsFullscreen(false)}
          onIndexChange={(idx) => {
            setCurrentIndex(idx);
            emblaApi?.scrollTo(idx, true);
          }}
        />,
        document.body
      )}
    </div>
  );
}

interface FullscreenViewerProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  onIndexChange: (idx: number) => void;
}

const SWIPE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const SWIPE_DURATION_MS = 340;

function FullscreenViewer({ images, initialIndex, onClose, onIndexChange }: FullscreenViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(initialIndex);
  const indexRef = useRef(initialIndex);
  const widthRef = useRef(0);
  const onIndexChangeRef = useRef(onIndexChange);

  const draggingRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lockedAxisRef = useRef<"x" | "y" | null>(null);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const velocityRef = useRef(0);
  const dragOffsetRef = useRef(0);

  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  const setTrackTransform = useCallback((px: number, animated: boolean) => {
    const t = trackRef.current;
    if (!t) return;
    t.style.transition = animated
      ? `transform ${SWIPE_DURATION_MS}ms ${SWIPE_EASE}`
      : "none";
    t.style.transform = `translate3d(${px}px, 0, 0)`;
  }, []);

  const settleTo = useCallback((targetIndex: number, animated: boolean) => {
    const clamped = Math.max(0, Math.min(images.length - 1, targetIndex));
    const w = widthRef.current || containerRef.current?.clientWidth || 0;
    if (w > 0) widthRef.current = w;
    setTrackTransform(-clamped * w, animated);
    if (clamped !== indexRef.current) {
      indexRef.current = clamped;
      setIndex(clamped);
      onIndexChangeRef.current(clamped);
    }
  }, [images.length, setTrackTransform]);

  useEffect(() => {
    indexRef.current = initialIndex;
    setIndex(initialIndex);
    let cancelled = false;
    let attempts = 0;
    const tryAlign = () => {
      if (cancelled) return;
      const c = containerRef.current;
      if (!c) return;
      const w = c.clientWidth;
      if (w > 0) {
        widthRef.current = w;
        setTrackTransform(-initialIndex * w, false);
        return;
      }
      if (attempts++ < 30) {
        window.requestAnimationFrame(tryAlign);
      }
    };
    tryAlign();
    return () => {
      cancelled = true;
    };
  }, [initialIndex, setTrackTransform]);

  useEffect(() => {
    const handleResize = () => {
      const c = containerRef.current;
      if (!c) return;
      const w = c.clientWidth;
      if (w <= 0) return;
      widthRef.current = w;
      if (!draggingRef.current) {
        setTrackTransform(-indexRef.current * w, false);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [setTrackTransform]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (draggingRef.current) return;
    const c = containerRef.current;
    if (!c) return;
    const w = c.clientWidth;
    if (w > 0) widthRef.current = w;
    draggingRef.current = true;
    activePointerRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lockedAxisRef.current = null;
    lastXRef.current = e.clientX;
    lastTRef.current = performance.now();
    velocityRef.current = 0;
    dragOffsetRef.current = 0;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    const tr = trackRef.current;
    if (tr) tr.style.transition = "none";
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || activePointerRef.current !== e.pointerId) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    if (lockedAxisRef.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        lockedAxisRef.current = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
      } else {
        return;
      }
    }
    if (lockedAxisRef.current === "y") return;

    dragOffsetRef.current = dx;
    const now = performance.now();
    const dt = now - lastTRef.current;
    if (dt > 0) {
      const inst = (e.clientX - lastXRef.current) / dt;
      velocityRef.current = velocityRef.current * 0.6 + inst * 0.4;
    }
    lastXRef.current = e.clientX;
    lastTRef.current = now;

    const w = widthRef.current || 1;
    let offset = dx;
    if (indexRef.current === 0 && dx > 0) offset = dx * 0.35;
    if (indexRef.current === images.length - 1 && dx < 0) offset = dx * 0.35;
    setTrackTransform(-indexRef.current * w + offset, false);
  }, [images.length, setTrackTransform]);

  const finishDrag = useCallback((e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    if (!draggingRef.current || activePointerRef.current !== e.pointerId) return;
    draggingRef.current = false;
    activePointerRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (cancelled || lockedAxisRef.current !== "x") {
      settleTo(indexRef.current, true);
      return;
    }

    const w = widthRef.current || 1;
    const dx = dragOffsetRef.current;
    const v = velocityRef.current;
    const distanceThreshold = w * 0.18;
    const velocityThreshold = 0.35;

    let target = indexRef.current;
    if (dx <= -distanceThreshold || v <= -velocityThreshold) {
      target = indexRef.current + 1;
    } else if (dx >= distanceThreshold || v >= velocityThreshold) {
      target = indexRef.current - 1;
    }
    settleTo(target, true);
  }, [settleTo]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(e, false);
  }, [finishDrag]);

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    finishDrag(e, true);
  }, [finishDrag]);

  const goPrev = useCallback(() => settleTo(indexRef.current - 1, true), [settleTo]);
  const goNext = useCallback(() => settleTo(indexRef.current + 1, true), [settleTo]);
  const goTo = useCallback((i: number) => settleTo(i, true), [settleTo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goPrev, goNext]);

  useEffect(() => {
    if (!images?.length) return;
    const targets = [index - 1, index, index + 1].filter(
      (i) => i >= 0 && i < images.length,
    );
    targets.forEach((i) => {
      const img = new Image();
      img.src = getFullscreenImageUrl(images[i]);
      if (img.decode) img.decode().catch(() => {});
    });
  }, [index, images]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black"
      dir="ltr"
      data-testid="fullscreen-gallery"
      style={{ height: "100dvh" }}
    >
      <div className="absolute top-0 left-0 right-0 h-16 bg-black/40 pointer-events-none z-20" />

      <button
        className="absolute top-[env(safe-area-inset-top,24px)] right-4 z-30 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        onClick={onClose}
        data-testid="button-close-fullscreen"
      >
        <X className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <div className="absolute top-[env(safe-area-inset-top,24px)] mt-2 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-white/15 backdrop-blur-md px-3 py-1 rounded-full z-30 border border-white/10">
        {index + 1} / {images.length}
      </div>

      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden"
        dir="ltr"
        style={{ height: "100dvh", touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        <div
          ref={trackRef}
          className="flex h-full"
          style={{
            width: "100%",
            height: "100dvh",
            willChange: "transform",
            transform: "translate3d(0,0,0)",
          }}
        >
          {images.map((img, idx) => {
            const shouldRenderImage = Math.abs(idx - index) <= 2;
            return (
              <div
                key={idx}
                className="relative h-full"
                style={{
                  flex: "0 0 100%",
                  width: "100%",
                  minWidth: "100%",
                }}
                data-testid={`fullscreen-slide-${idx}`}
              >
                {shouldRenderImage ? (
                  <img
                    src={getFullscreenImageUrl(img)}
                    alt={`Image ${idx + 1}`}
                    loading={Math.abs(idx - index) <= 1 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    onError={retryObjectImg}
                    className="w-full h-full object-contain pointer-events-none select-none"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {images.length > 1 && (
        <>
          {index > 0 && (
            <button className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 p-2 z-20" onClick={goPrev} data-testid="button-fullscreen-prev">
              <ChevronLeft className="h-8 w-8" strokeWidth={2} />
            </button>
          )}
          {index < images.length - 1 && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 p-2 z-20" onClick={goNext} data-testid="button-fullscreen-next">
              <ChevronRight className="h-8 w-8" strokeWidth={2} />
            </button>
          )}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`h-2 rounded-full transition-all ${idx === index ? "bg-white w-5" : "bg-white/50 w-2"}`}
                data-testid={`fullscreen-dot-${idx}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
