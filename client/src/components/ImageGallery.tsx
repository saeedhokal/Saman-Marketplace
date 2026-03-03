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
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState(0);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const [dragOffset, setDragOffset] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDragLocked = useRef(false);

  const goToPrevious = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    lastPinchDist.current = 0;
    isPinching.current = false;
  }, []);

  const handleMainTouchStart = useCallback((e: React.TouchEvent) => {
    if (images.length <= 1) return;
    if (e.touches.length === 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      isDragLocked.current = false;
    }
  }, [images.length]);

  const handleMainTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (!isDragLocked.current) {
      if (dy > 20) {
        touchStartRef.current = null;
        setDragOffset(0);
        return;
      }
      if (Math.abs(dx) > 8) {
        isDragLocked.current = true;
      }
    }
    if (isDragLocked.current) {
      setDragOffset(dx);
    }
  }, []);

  const handleMainTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) {
      setDragOffset(0);
      return;
    }
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const elapsed = Date.now() - touchStartRef.current.time;
    const velocity = Math.abs(dx) / elapsed;
    touchStartRef.current = null;
    isDragLocked.current = false;

    if (Math.abs(dx) > 60 || velocity > 0.4) {
      if (dx > 0) goToPrevious();
      else goToNext();
    }
    setDragOffset(0);
  }, [goToPrevious, goToNext]);

  const handleFullscreenTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1 && scale <= 1) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, time: Date.now() };
      isDragLocked.current = false;
    } else if (e.touches.length === 1 && scale > 1) {
      lastTouchCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [scale]);

  const handleFullscreenTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDist.current > 0) {
        const newScale = Math.max(1, Math.min(5, scale * (dist / lastPinchDist.current)));
        setScale(newScale);
        if (newScale <= 1) {
          setTranslate({ x: 0, y: 0 });
        }
      }
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      const dx = e.touches[0].clientX - lastTouchCenter.current.x;
      const dy = e.touches[0].clientY - lastTouchCenter.current.y;
      lastTouchCenter.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    } else if (e.touches.length === 1 && scale <= 1 && images.length > 1) {
      handleMainTouchMove(e);
    }
  }, [scale, images.length, handleMainTouchMove]);

  const handleFullscreenTouchEnd = useCallback((e: React.TouchEvent) => {
    if (isPinching.current) {
      isPinching.current = false;
      lastPinchDist.current = 0;
      if (scale <= 1.05) {
        resetZoom();
      }
      return;
    }
    if (scale <= 1 && images.length > 1) {
      handleMainTouchEnd(e);
    }
  }, [scale, images.length, handleMainTouchEnd, resetZoom]);

  const handleDoubleTap = useCallback(() => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  }, [scale, resetZoom]);

  const lastTapRef = useRef(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [handleDoubleTap]);

  const handleClick = () => {
    if (!isDragging && Math.abs(dragOffset) < 5) {
      setIsFullscreen(true);
    }
  };

  useEffect(() => {
    resetZoom();
  }, [currentIndex, resetZoom]);

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
          onTouchStart={handleMainTouchStart}
          onTouchMove={handleMainTouchMove}
          onTouchEnd={handleMainTouchEnd}
          onClick={handleClick}
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
                style={{
                  transform: dragOffset !== 0 ? `translateX(${dragOffset}px)` : undefined,
                }}
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
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              data-testid="button-prev-image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              data-testid="button-next-image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentIndex
                      ? "bg-white w-4"
                      : "bg-white/50"
                  }`}
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
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                idx === currentIndex
                  ? "border-accent"
                  : "border-transparent"
              }`}
              data-testid={`thumbnail-${idx}`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
              data-testid="fullscreen-gallery"
              onTouchStart={handleFullscreenTouchStart}
              onTouchMove={handleFullscreenTouchMove}
              onTouchEnd={handleFullscreenTouchEnd}
            >
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-0" />
              
              <button
                className="absolute top-[env(safe-area-inset-top,24px)] right-4 z-10 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                onClick={() => { setIsFullscreen(false); resetZoom(); }}
                data-testid="button-close-fullscreen"
              >
                <X className="h-7 w-7" strokeWidth={2.5} />
              </button>

              <div className="absolute top-[env(safe-area-inset-top,24px)] mt-2 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-white/15 backdrop-blur-md px-3 py-1 rounded-full z-10 border border-white/10">
                {currentIndex + 1} / {images.length}
              </div>

              <div
                ref={imgContainerRef}
                className="w-full h-full flex items-center justify-center p-4"
                onClick={handleTap}
                style={{ touchAction: 'none' }}
              >
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.img
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
                      transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)${dragOffset !== 0 ? ` translateX(${dragOffset}px)` : ''}`,
                      transition: isPinching.current ? 'none' : 'transform 0.1s ease-out',
                    }}
                  />
                </AnimatePresence>
              </div>

              {images.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/80 p-2"
                    onClick={goToPrevious}
                    data-testid="button-fullscreen-prev"
                  >
                    <ChevronLeft className="h-8 w-8" strokeWidth={2} />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 p-2"
                    onClick={goToNext}
                    data-testid="button-fullscreen-next"
                  >
                    <ChevronRight className="h-8 w-8" strokeWidth={2} />
                  </button>

                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setDirection(idx > currentIndex ? 1 : -1);
                          setCurrentIndex(idx);
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === currentIndex
                            ? "bg-white w-6"
                            : "bg-white/50"
                        }`}
                        data-testid={`fullscreen-dot-${idx}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
