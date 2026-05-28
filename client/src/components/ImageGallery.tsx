import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import { X, ChevronLeft, ChevronRight, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { retryObjectImg } from "@/lib/bustObjectUrl";
import { useToast } from "@/hooks/use-toast";

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
  shareUrl?: string;
}

export function ImageGallery({ images, initialIndex = 0, shareUrl }: ImageGalleryProps) {
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
          shareUrl={shareUrl}
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
  shareUrl?: string;
  onClose: () => void;
  onIndexChange: (idx: number) => void;
}

const SWIPE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const SWIPE_DURATION_MS = 340;

function FullscreenViewer({ images, initialIndex, shareUrl, onClose, onIndexChange }: FullscreenViewerProps) {
  const { toast } = useToast();
  const [index, setIndex] = useState(initialIndex);
  const [pendingRenderIndex, setPendingRenderIndex] = useState<number | null>(initialIndex);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());
  const singleTapTimerRef = useRef<number | null>(null);

  const clearSingleTapTimer = useCallback(() => {
    if (singleTapTimerRef.current !== null) {
      window.clearTimeout(singleTapTimerRef.current);
      singleTapTimerRef.current = null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link Copied", description: "Listing link copied to clipboard." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not copy link." });
    }
  }, [shareUrl, toast]);

  useEffect(() => () => clearSingleTapTimer(), [clearSingleTapTimer]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const indexRef = useRef(initialIndex);
  const widthRef = useRef(0);
  const currentXRef = useRef(0);

  const draggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const velocityRef = useRef(0);
  const dragOffsetRef = useRef(0);
  const lockedAxisRef = useRef<"x" | "y" | null>(null);

  const animationRef = useRef<Animation | null>(null);
  const onIndexChangeRef = useRef(onIndexChange);

  // ===== Pinch zoom state (FullscreenViewer only) =====
  // Active image gets a transform (scale + translate) applied directly
  // to the <img> element via ref so we don't trigger React re-renders
  // during gestures. Transform always resets to identity when the
  // index changes or the viewer closes.
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const transformRef = useRef({ scale: 1, tx: 0, ty: 0 });

  // Multi-pointer tracking for pinch
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchActiveRef = useRef(false);
  const pinchStartDistRef = useRef(0);
  const pinchStartCenterRef = useRef({ x: 0, y: 0 });
  const pinchStartTransformRef = useRef({ scale: 1, tx: 0, ty: 0 });

  // Single-pointer pan when already zoomed in
  const panActiveRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panBaseRef = useRef({ tx: 0, ty: 0 });

  // Double-tap detection
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const DOUBLE_TAP_MS = 300;
  const DOUBLE_TAP_DIST = 40;
  const DOUBLE_TAP_SCALE = 2.5;

  const MIN_SCALE = 1;
  const MAX_SCALE = 4;

  const applyTransform = useCallback(() => {
    const img = imageRefs.current[indexRef.current];
    if (!img) return;
    const { scale, tx, ty } = transformRef.current;
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    img.style.willChange = scale === 1 ? "auto" : "transform";
  }, []);

  // Animate to a target scale, focused on a viewport point (focalX, focalY).
  // Used by double-tap to zoom in centered on the tap, or zoom back out to 1×.
  const animateToScale = useCallback((targetScale: number, focalX: number, focalY: number) => {
    const img = imageRefs.current[indexRef.current];
    const container = containerRef.current;
    if (!img || !container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let tx = 0, ty = 0;
    if (targetScale > 1) {
      tx = (focalX - cx) * (1 - targetScale);
      ty = (focalY - cy) * (1 - targetScale);
      const w = rect.width;
      const h = rect.height;
      const maxX = Math.max(0, ((targetScale - 1) * w) / 2);
      const maxY = Math.max(0, ((targetScale - 1) * h) / 2);
      tx = Math.max(-maxX, Math.min(maxX, tx));
      ty = Math.max(-maxY, Math.min(maxY, ty));
    }
    transformRef.current = { scale: targetScale, tx, ty };
    img.style.transition = "transform 220ms ease-out";
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${targetScale})`;
    img.style.willChange = targetScale === 1 ? "auto" : "transform";
    window.setTimeout(() => {
      if (img && transformRef.current.scale === targetScale) {
        img.style.transition = "none";
      }
    }, 240);
  }, []);

  const clampPan = useCallback((tx: number, ty: number, scale: number) => {
    const w = containerRef.current?.clientWidth || window.innerWidth || 1;
    const h = containerRef.current?.clientHeight || window.innerHeight || 1;
    // With scale > 1, image overflows viewport by (scale-1) on each axis.
    // Max pan = half of that overflow so edges stay in view.
    const maxX = Math.max(0, ((scale - 1) * w) / 2);
    const maxY = Math.max(0, ((scale - 1) * h) / 2);
    return {
      tx: Math.max(-maxX, Math.min(maxX, tx)),
      ty: Math.max(-maxY, Math.min(maxY, ty)),
    };
  }, []);

  const resetTransform = useCallback((targetIdx: number, animated = false) => {
    const img = imageRefs.current[targetIdx];
    if (img) {
      img.style.transition = animated ? "transform 220ms ease-out" : "none";
      img.style.transform = "translate3d(0,0,0) scale(1)";
      if (animated) {
        window.setTimeout(() => {
          if (img) img.style.transition = "none";
        }, 240);
      } else {
        img.style.willChange = "auto";
      }
    }
    if (targetIdx === indexRef.current) {
      transformRef.current = { scale: 1, tx: 0, ty: 0 };
    }
  }, []);

  useEffect(() => {
    onIndexChangeRef.current = onIndexChange;
  }, [onIndexChange]);

  const total = images.length;

  const clampIndex = useCallback(
    (value: number) => Math.max(0, Math.min(total - 1, value)),
    [total]
  );

  const getWidth = useCallback(() => {
    const w = containerRef.current?.clientWidth || window.innerWidth || 1;
    widthRef.current = w;
    return w;
  }, []);

  const setX = useCallback((x: number) => {
    const track = trackRef.current;
    if (!track) return;
    currentXRef.current = x;
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  }, []);

  const cancelAnimation = useCallback(() => {
    const anim = animationRef.current;
    if (anim) {
      try { anim.cancel(); } catch {}
      animationRef.current = null;
    }
  }, []);

  const commitIndex = useCallback((nextIndex: number) => {
    // Reset transform on both old and new active image so we never
    // carry a zoomed state across slides.
    const oldIdx = indexRef.current;
    if (oldIdx !== nextIndex) {
      const oldImg = imageRefs.current[oldIdx];
      if (oldImg) {
        oldImg.style.transition = "none";
        oldImg.style.transform = "translate3d(0,0,0) scale(1)";
        oldImg.style.willChange = "auto";
      }
    }
    indexRef.current = nextIndex;
    transformRef.current = { scale: 1, tx: 0, ty: 0 };
    const newImg = imageRefs.current[nextIndex];
    if (newImg) {
      newImg.style.transition = "none";
      newImg.style.transform = "translate3d(0,0,0) scale(1)";
      newImg.style.willChange = "auto";
    }
    setIndex(nextIndex);
    setPendingRenderIndex(null);
    onIndexChangeRef.current(nextIndex);
  }, []);

  const animateToIndex = useCallback(
    (targetIndexRaw: number, animated = true) => {
      const track = trackRef.current;
      if (!track) return;

      const targetIndex = clampIndex(targetIndexRaw);
      const w = getWidth();

      cancelAnimation();

      const fromX = currentXRef.current;
      const toX = -targetIndex * w;

      setPendingRenderIndex(targetIndex);

      track.style.transition = "none";
      track.style.willChange = "transform";
      track.style.transform = `translate3d(${fromX}px, 0, 0)`;
      currentXRef.current = fromX;

      if (!animated || Math.abs(fromX - toX) < 0.5) {
        setX(toX);
        commitIndex(targetIndex);
        return;
      }

      const anim = track.animate(
        [
          { transform: `translate3d(${fromX}px, 0, 0)` },
          { transform: `translate3d(${toX}px, 0, 0)` },
        ],
        {
          duration: SWIPE_DURATION_MS,
          easing: SWIPE_EASE,
          fill: "both",
        }
      );

      animationRef.current = anim;

      anim.onfinish = () => {
        if (animationRef.current !== anim) return;
        animationRef.current = null;
        setX(toX);
        try { anim.cancel(); } catch {}
        commitIndex(targetIndex);
      };

      anim.oncancel = () => {
        if (animationRef.current === anim) {
          animationRef.current = null;
        }
      };
    },
    [cancelAnimation, clampIndex, commitIndex, getWidth, setX]
  );

  const jumpToIndex = useCallback(
    (targetIndexRaw: number) => animateToIndex(clampIndex(targetIndexRaw), true),
    [animateToIndex, clampIndex]
  );

  useEffect(() => {
    indexRef.current = initialIndex;
    setIndex(initialIndex);
    setPendingRenderIndex(initialIndex);

    let raf = 0;
    let tries = 0;

    const align = () => {
      const w = containerRef.current?.clientWidth || 0;
      if (!w && tries < 30) {
        tries += 1;
        raf = requestAnimationFrame(align);
        return;
      }
      const realW = getWidth();
      const x = -initialIndex * realW;
      cancelAnimation();
      setX(x);
      setPendingRenderIndex(null);
    };

    raf = requestAnimationFrame(align);
    return () => cancelAnimationFrame(raf);
  }, [initialIndex, getWidth, cancelAnimation, setX]);

  useEffect(() => {
    const preloadIndexes = [index - 2, index - 1, index, index + 1, index + 2].filter(
      (i) => i >= 0 && i < total
    );
    preloadIndexes.forEach((i) => {
      const img = new Image();
      img.src = getFullscreenImageUrl(images[i]);
      if (img.decode) img.decode().catch(() => {});
    });
  }, [images, index, total]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); jumpToIndex(indexRef.current - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); jumpToIndex(indexRef.current + 1); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [jumpToIndex, onClose]);

  useEffect(() => {
    const onResize = () => {
      if (draggingRef.current) return;
      const w = getWidth();
      const x = -indexRef.current * w;
      cancelAnimation();
      setX(x);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [cancelAnimation, getWidth, setX]);

  useEffect(() => {
    return () => { cancelAnimation(); };
  }, [cancelAnimation]);

  const cancelSwipe = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (activePointerIdRef.current !== null) {
      try { e.currentTarget.releasePointerCapture(activePointerIdRef.current); } catch {}
    }
    activePointerIdRef.current = null;
    animateToIndex(indexRef.current, true);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    // Always track the pointer so we know how many fingers are down
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // ===== Double-tap to zoom (single finger only) =====
    if (pointersRef.current.size === 1) {
      const now = performance.now();
      const last = lastTapRef.current;
      if (
        last &&
        now - last.t < DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - last.x, e.clientY - last.y) < DOUBLE_TAP_DIST
      ) {
        // Double-tap detected — cancel any pending single-tap toggle,
        // toggle zoom, and swallow this gesture
        clearSingleTapTimer();
        lastTapRef.current = null;
        cancelSwipe(e);
        draggingRef.current = false;
        activePointerIdRef.current = null;
        panActiveRef.current = false;
        pinchActiveRef.current = false;
        const currentScale = transformRef.current.scale;
        const target = currentScale > 1.01 ? 1 : DOUBLE_TAP_SCALE;
        animateToScale(target, e.clientX, e.clientY);
        // Remove this pointer so subsequent moves don't drag-swipe
        pointersRef.current.delete(e.pointerId);
        try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
        return;
      }
      lastTapRef.current = { t: now, x: e.clientX, y: e.clientY };
    } else {
      // Multi-finger gesture cancels the pending tap
      lastTapRef.current = null;
    }

    // ===== Pinch starts when a second finger touches down =====
    if (pointersRef.current.size === 2) {
      cancelSwipe(e);
      panActiveRef.current = false;

      const pts = Array.from(pointersRef.current.values());
      const p1 = pts[0];
      const p2 = pts[1];
      pinchStartDistRef.current = Math.max(1, Math.hypot(p1.x - p2.x, p1.y - p2.y));
      pinchStartCenterRef.current = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      pinchStartTransformRef.current = { ...transformRef.current };
      pinchActiveRef.current = true;

      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      return;
    }

    // ===== Pan when already zoomed (single finger after zoom) =====
    if (transformRef.current.scale > 1.01) {
      cancelSwipe(e);
      panActiveRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panBaseRef.current = { tx: transformRef.current.tx, ty: transformRef.current.ty };
      const img = imageRefs.current[indexRef.current];
      if (img) img.style.transition = "none";
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      return;
    }

    // ===== Swipe (existing behavior, only at scale 1) =====
    if (draggingRef.current) return;

    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    cancelAnimation();

    const w = container.clientWidth || window.innerWidth || 1;
    widthRef.current = w;

    draggingRef.current = true;
    activePointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    lastXRef.current = e.clientX;
    lastTRef.current = performance.now();
    velocityRef.current = 0;
    dragOffsetRef.current = 0;
    lockedAxisRef.current = null;

    track.style.transition = "none";
    track.style.willChange = "transform";

    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Update tracked pointer position
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    // ===== Pinch =====
    if (pinchActiveRef.current) {
      if (pointersRef.current.size < 2) return;
      const pts = Array.from(pointersRef.current.values());
      const p1 = pts[0];
      const p2 = pts[1];
      const dist = Math.max(1, Math.hypot(p1.x - p2.x, p1.y - p2.y));
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

      const scaleRatio = dist / pinchStartDistRef.current;
      // Strict clamp to [MIN_SCALE, MAX_SCALE] per spec — no elastic zone.
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchStartTransformRef.current.scale * scaleRatio));

      const dx = center.x - pinchStartCenterRef.current.x;
      const dy = center.y - pinchStartCenterRef.current.y;
      const clamped = clampPan(
        pinchStartTransformRef.current.tx + dx,
        pinchStartTransformRef.current.ty + dy,
        newScale
      );
      transformRef.current = { scale: newScale, tx: clamped.tx, ty: clamped.ty };
      applyTransform();
      return;
    }

    // ===== Pan when zoomed =====
    if (panActiveRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      const clamped = clampPan(
        panBaseRef.current.tx + dx,
        panBaseRef.current.ty + dy,
        transformRef.current.scale
      );
      transformRef.current = { scale: transformRef.current.scale, tx: clamped.tx, ty: clamped.ty };
      applyTransform();
      return;
    }

    // ===== Swipe (existing) =====
    if (!draggingRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;

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

    const now = performance.now();
    const dt = Math.max(1, now - lastTRef.current);
    const instantVelocity = (e.clientX - lastXRef.current) / dt;
    velocityRef.current = velocityRef.current * 0.6 + instantVelocity * 0.4;
    lastXRef.current = e.clientX;
    lastTRef.current = now;

    const w = widthRef.current || getWidth();

    let offset = dx;
    if (indexRef.current === 0 && dx > 0) offset = dx * 0.35;
    if (indexRef.current === total - 1 && dx < 0) offset = dx * 0.35;

    dragOffsetRef.current = offset;
    setX(-indexRef.current * w + offset);
  };

  const finishPointer = (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    // Remove this pointer from tracking
    pointersRef.current.delete(e.pointerId);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}

    // ===== End of pinch =====
    if (pinchActiveRef.current) {
      if (pointersRef.current.size >= 2) return; // shouldn't happen but be safe

      // If only one finger remains, leave pinch and hand off to pan
      // (so user keeps controlling the zoomed image without lifting).
      if (pointersRef.current.size === 1 && transformRef.current.scale > 1.01) {
        pinchActiveRef.current = false;
        const remaining = Array.from(pointersRef.current.entries())[0];
        if (remaining) {
          panActiveRef.current = true;
          panStartRef.current = { x: remaining[1].x, y: remaining[1].y };
          panBaseRef.current = { tx: transformRef.current.tx, ty: transformRef.current.ty };
        }
        return;
      }

      // Both fingers up — finalize zoom state
      pinchActiveRef.current = false;
      const finalScale = transformRef.current.scale;
      const img = imageRefs.current[indexRef.current];
      if (finalScale <= 1.02) {
        // Snap back to identity with a short animation
        if (img) {
          img.style.transition = "transform 220ms ease-out";
          img.style.transform = "translate3d(0,0,0) scale(1)";
          img.style.willChange = "auto";
        }
        transformRef.current = { scale: 1, tx: 0, ty: 0 };
        window.setTimeout(() => {
          if (img && transformRef.current.scale === 1) img.style.transition = "none";
        }, 240);
      } else {
        // Clamp to pan bounds in case we drifted past edges during pinch
        const clamped = clampPan(transformRef.current.tx, transformRef.current.ty, finalScale);
        transformRef.current = { scale: finalScale, tx: clamped.tx, ty: clamped.ty };
        applyTransform();
      }
      return;
    }

    // ===== End of pan =====
    if (panActiveRef.current) {
      panActiveRef.current = false;
      // If user has lifted to pan-with-zero-scale, snap back to identity
      if (transformRef.current.scale <= 1.01) {
        resetTransform(indexRef.current, true);
      }
      return;
    }

    // ===== End of swipe (existing) =====
    if (!draggingRef.current) return;
    if (activePointerIdRef.current !== e.pointerId) return;

    const wasUnmoved = lockedAxisRef.current === null;

    draggingRef.current = false;
    activePointerIdRef.current = null;

    if (cancelled || lockedAxisRef.current !== "x") {
      animateToIndex(indexRef.current, true);
      // Clean tap (never crossed move threshold, not cancelled, not zoomed):
      // schedule a controls-visibility toggle after the double-tap window.
      if (
        !cancelled &&
        wasUnmoved &&
        transformRef.current.scale <= 1.01 &&
        !pinchActiveRef.current &&
        !panActiveRef.current
      ) {
        clearSingleTapTimer();
        singleTapTimerRef.current = window.setTimeout(() => {
          singleTapTimerRef.current = null;
          setControlsVisible((v) => !v);
        }, DOUBLE_TAP_MS);
      }
      return;
    }

    const w = widthRef.current || getWidth();
    const dragOffset = dragOffsetRef.current;
    const velocity = velocityRef.current;

    const distanceThreshold = w * 0.18;
    const velocityThreshold = 0.35;

    let target = indexRef.current;
    if (dragOffset <= -distanceThreshold || velocity <= -velocityThreshold) target += 1;
    else if (dragOffset >= distanceThreshold || velocity >= velocityThreshold) target -= 1;

    animateToIndex(clampIndex(target), true);
  };

  const shouldRenderSlide = (slideIndex: number) => {
    if (Math.abs(slideIndex - index) <= 2) return true;
    if (pendingRenderIndex !== null && Math.abs(slideIndex - pendingRenderIndex) <= 2) return true;
    return false;
  };

  const initialTrackPct = total > 0 ? -(initialIndex * 100) / total : 0;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black"
      dir="ltr"
      data-testid="fullscreen-gallery"
      style={{
        height: "100dvh",
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden bg-black"
        style={{
          height: "100dvh",
          touchAction: "none",
          contain: "layout paint size",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finishPointer(e, false)}
        onPointerCancel={(e) => finishPointer(e, true)}
        onLostPointerCapture={(e) => {
          if (draggingRef.current && activePointerIdRef.current === e.pointerId) {
            finishPointer(e, true);
          }
        }}
      >
        <div
          ref={trackRef}
          className="flex h-full"
          style={{
            width: `${total * 100}%`,
            height: "100dvh",
            transform: `translate3d(${initialTrackPct}%, 0, 0)`,
            willChange: "transform",
          }}
        >
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative h-full flex items-center justify-center bg-black"
              style={{
                flex: "0 0 100vw",
                width: "100vw",
                height: "100dvh",
              }}
              data-testid={`fullscreen-slide-${idx}`}
            >
              {shouldRenderSlide(idx) ? (
                <>
                  {!loadedSet.has(idx) && (
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      data-testid={`fullscreen-loading-${idx}`}
                    >
                      <Loader2 className="h-8 w-8 text-white/60 animate-spin" />
                    </div>
                  )}
                  <img
                    ref={(el) => { imageRefs.current[idx] = el; }}
                    src={getFullscreenImageUrl(img)}
                    alt={`Image ${idx + 1}`}
                    loading={Math.abs(idx - index) <= 1 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                    onLoad={() => {
                      setLoadedSet((prev) => {
                        if (prev.has(idx)) return prev;
                        const next = new Set(prev);
                        next.add(idx);
                        return next;
                      });
                    }}
                    onError={retryObjectImg}
                    className="pointer-events-none select-none object-contain"
                    style={{
                      width: "100%",
                      height: "100dvh",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                      WebkitTouchCallout: "none",
                      transformOrigin: "center center",
                    }}
                  />
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`absolute top-0 left-0 right-0 h-16 bg-black/40 pointer-events-none z-20 transition-opacity duration-200 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
      />

      <button
        className={`absolute top-[env(safe-area-inset-top,24px)] right-4 z-30 text-white p-2 hover:bg-white/10 rounded-full transition-all duration-200 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
        data-testid="button-close-fullscreen"
        aria-label="Close"
      >
        <X className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {shareUrl && (
        <button
          className={`absolute top-[env(safe-area-inset-top,24px)] left-4 z-30 text-white p-2 hover:bg-white/10 rounded-full transition-all duration-200 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={handleShare}
          data-testid="button-share-fullscreen"
          aria-label="Share"
        >
          <Share2 className="h-6 w-6" strokeWidth={2.2} />
        </button>
      )}

      <div
        className={`absolute top-[env(safe-area-inset-top,24px)] mt-2 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-white/15 backdrop-blur-md px-3 py-1 rounded-full z-30 border border-white/10 transition-opacity duration-200 pointer-events-none ${controlsVisible ? "opacity-100" : "opacity-0"}`}
        data-testid="text-fullscreen-counter"
      >
        {index + 1} / {total}
      </div>

      {total > 1 && (
        <>
          {index > 0 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 p-2 z-20"
              onClick={() => jumpToIndex(indexRef.current - 1)}
              data-testid="button-fullscreen-prev"
            >
              <ChevronLeft className="h-8 w-8" strokeWidth={2} />
            </button>
          )}
          {index < total - 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 p-2 z-20"
              onClick={() => jumpToIndex(indexRef.current + 1)}
              data-testid="button-fullscreen-next"
            >
              <ChevronRight className="h-8 w-8" strokeWidth={2} />
            </button>
          )}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => jumpToIndex(idx)}
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
