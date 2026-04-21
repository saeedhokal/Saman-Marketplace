import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <>
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
              <img src={img} alt={`Thumbnail ${idx + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {isFullscreen && (
            <FullscreenViewer
              images={images}
              initialIndex={currentIndex}
              onClose={() => setIsFullscreen(false)}
              onIndexChange={(idx) => {
                setCurrentIndex(idx);
                emblaApi?.scrollTo(idx, true);
              }}
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
  initialIndex: number;
  onClose: () => void;
  onIndexChange: (idx: number) => void;
}

function FullscreenViewer({ images, initialIndex, onClose, onIndexChange }: FullscreenViewerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialIndex,
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
    duration: 22,
  });
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const i = emblaApi.selectedScrollSnap();
      setIndex(i);
      onIndexChange(i);
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onIndexChange]);

  const goPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const goNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const goTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goPrev, goNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[9999] bg-black"
      data-testid="fullscreen-gallery"
    >
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-20" />

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

      <div ref={emblaRef} className="overflow-hidden w-full h-full">
        <div className="flex h-full touch-pan-y">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative flex-[0_0_100%] min-w-0 h-full flex items-center justify-center"
              data-testid={`fullscreen-slide-${idx}`}
            >
              <img
                src={img}
                alt={`Image ${idx + 1}`}
                loading={Math.abs(idx - initialIndex) <= 1 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="max-w-full max-h-full object-contain select-none"
                style={{ touchAction: "pinch-zoom" }}
              />
            </div>
          ))}
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
    </motion.div>
  );
}
