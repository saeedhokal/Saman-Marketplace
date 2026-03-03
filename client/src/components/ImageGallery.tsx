import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
}

const swipeVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function ImageGallery({ images, initialIndex = 0 }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [direction, setDirection] = useState(0);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDragLocked = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  const goToPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (images.length <= 1) return;
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      isDragLocked.current = false;
    }
  }, [images.length]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (!isDragLocked.current) {
      if (dy > 20) {
        touchStartRef.current = null;
        setDragOffset(0);
        return;
      }
      if (Math.abs(dx) > 8) isDragLocked.current = true;
    }
    if (isDragLocked.current) setDragOffset(dx);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) { setDragOffset(0); return; }
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const elapsed = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(dx) / elapsed;
    touchStartRef.current = null;
    isDragLocked.current = false;
    if (Math.abs(dx) > 60 || velocity > 0.4) {
      if (dx > 0) goToPrevious(); else goToNext();
    }
    setDragOffset(0);
  }, [goToPrevious, goToNext]);

  const handleImageClick = useCallback(() => {
    if (Math.abs(dragOffset) < 5) setIsFullscreen(true);
  }, [dragOffset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === "Escape") setIsFullscreen(false);
        if (e.key === "ArrowLeft") goToPrevious();
        if (e.key === "ArrowRight") goToNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, goToPrevious, goToNext]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="relative">
        <div
          className="aspect-square w-full overflow-hidden rounded-xl bg-secondary/30 cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleImageClick}
          data-testid="image-gallery-main"
        >
          <div className="w-full h-full relative">
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.img
                key={currentIndex}
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                className="w-full h-full object-contain pointer-events-none absolute inset-0"
                custom={direction}
                variants={swipeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
                draggable={false}
                style={dragOffset !== 0 ? { transform: `translateX(${dragOffset}px)` } : undefined}
              />
            </AnimatePresence>
          </div>
        </div>

        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm h-8 w-8"
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              data-testid="button-prev-image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm h-8 w-8"
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              data-testid="button-next-image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? "bg-white w-4" : "bg-white/50"}`}
                  data-testid={`dot-indicator-${idx}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${idx === currentIndex ? "border-accent" : "border-transparent"}`}
              data-testid={`thumbnail-${idx}`}
            >
              <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {isFullscreen && (
            <FullscreenViewer
              images={images}
              currentIndex={currentIndex}
              direction={direction}
              onClose={() => setIsFullscreen(false)}
              onPrev={goToPrevious}
              onNext={goToNext}
              onSelect={(idx) => { setDirection(idx > currentIndex ? 1 : -1); setCurrentIndex(idx); }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

interface FullscreenViewerProps {
  images: string[];
  currentIndex: number;
  direction: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (idx: number) => void;
}

function FullscreenViewer({ images, currentIndex, direction, onClose, onPrev, onNext, onSelect }: FullscreenViewerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const posRef = useRef({ x: 0, y: 0 });

  const lastDist = useRef(0);
  const lastCenter = useRef({ x: 0, y: 0 });
  const singleStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const isPanning = useRef(false);
  const lastTap = useRef(0);

  const [swipeDrag, setSwipeDrag] = useState(0);
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const swipeLocked = useRef(false);

  useEffect(() => {
    scaleRef.current = 1;
    posRef.current = { x: 0, y: 0 };
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [currentIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.sqrt(dx * dx + dy * dy);
      lastCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      isPanning.current = false;
      singleStart.current = null;
    } else if (e.touches.length === 1) {
      singleStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      isPanning.current = false;
      if (scaleRef.current <= 1) {
        swipeStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
        swipeLocked.current = false;
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (lastDist.current > 0) {
        const ratio = dist / lastDist.current;
        const newScale = Math.max(1, Math.min(5, scaleRef.current * ratio));
        scaleRef.current = newScale;
        setScale(newScale);
        if (newScale <= 1) {
          posRef.current = { x: 0, y: 0 };
          setPos({ x: 0, y: 0 });
        }
      }
      lastDist.current = dist;
      return;
    }

    if (e.touches.length === 1 && scaleRef.current > 1) {
      if (singleStart.current) {
        const dx = e.touches[0].clientX - singleStart.current.x;
        const dy = e.touches[0].clientY - singleStart.current.y;
        if (!isPanning.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          isPanning.current = true;
          lastCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        if (isPanning.current) {
          const moveDx = e.touches[0].clientX - lastCenter.current.x;
          const moveDy = e.touches[0].clientY - lastCenter.current.y;
          lastCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          posRef.current = { x: posRef.current.x + moveDx, y: posRef.current.y + moveDy };
          setPos({ ...posRef.current });
        }
      }
      return;
    }

    if (e.touches.length === 1 && scaleRef.current <= 1 && images.length > 1 && swipeStartRef.current) {
      const dx = e.touches[0].clientX - swipeStartRef.current.x;
      const dy = Math.abs(e.touches[0].clientY - swipeStartRef.current.y);
      if (!swipeLocked.current) {
        if (dy > 20) { swipeStartRef.current = null; setSwipeDrag(0); return; }
        if (Math.abs(dx) > 8) swipeLocked.current = true;
      }
      if (swipeLocked.current) setSwipeDrag(dx);
    }
  }, [images.length]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0 && lastDist.current > 0) {
      lastDist.current = 0;
      if (scaleRef.current <= 1.05) {
        scaleRef.current = 1;
        posRef.current = { x: 0, y: 0 };
        setScale(1);
        setPos({ x: 0, y: 0 });
      }
      return;
    }

    if (scaleRef.current <= 1 && swipeStartRef.current && images.length > 1) {
      const dx = e.changedTouches[0].clientX - swipeStartRef.current.x;
      const elapsed = Date.now() - swipeStartRef.current.time;
      const velocity = Math.abs(dx) / elapsed;
      swipeStartRef.current = null;
      swipeLocked.current = false;
      if (Math.abs(dx) > 60 || velocity > 0.4) {
        if (dx > 0) onPrev(); else onNext();
      }
      setSwipeDrag(0);
      return;
    }

    if (singleStart.current && !isPanning.current) {
      const now = Date.now();
      const elapsed = now - singleStart.current.time;
      if (elapsed < 300) {
        if (now - lastTap.current < 300) {
          if (scaleRef.current > 1) {
            scaleRef.current = 1;
            posRef.current = { x: 0, y: 0 };
            setScale(1);
            setPos({ x: 0, y: 0 });
          } else {
            scaleRef.current = 2.5;
            setScale(2.5);
          }
          lastTap.current = 0;
        } else {
          lastTap.current = now;
        }
      }
    }
    singleStart.current = null;
    isPanning.current = false;
  }, [images.length, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      data-testid="fullscreen-gallery"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-0" />

      <button
        className="absolute top-[env(safe-area-inset-top,24px)] right-4 z-10 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
        onClick={onClose}
        data-testid="button-close-fullscreen"
      >
        <X className="h-7 w-7" strokeWidth={2.5} />
      </button>

      <div className="absolute top-[env(safe-area-inset-top,24px)] mt-2 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-white/15 backdrop-blur-md px-3 py-1 rounded-full z-10 border border-white/10">
        {currentIndex + 1} / {images.length}
      </div>

      <div ref={containerRef} className="w-full h-full flex items-center justify-center p-4">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            ref={imgRef}
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain absolute"
            custom={direction}
            variants={swipeVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            draggable={false}
            style={{
              transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)${swipeDrag !== 0 ? ` translateX(${swipeDrag}px)` : ''}`,
              transformOrigin: 'center center',
            }}
          />
        </AnimatePresence>
      </div>

      {images.length > 1 && scale <= 1 && (
        <>
          <button className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 p-2" onClick={onPrev} data-testid="button-fullscreen-prev">
            <ChevronLeft className="h-8 w-8" strokeWidth={2} />
          </button>
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 p-2" onClick={onNext} data-testid="button-fullscreen-next">
            <ChevronRight className="h-8 w-8" strokeWidth={2} />
          </button>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentIndex ? "bg-white w-6" : "bg-white/50"}`}
                data-testid={`fullscreen-dot-${idx}`}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
