import { useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  // Check if at top of page - works for both container scroll and window scroll
  const isAtTop = useCallback(() => {
    // Check window scroll (iOS Safari typically uses this)
    if (window.scrollY <= 0) return true;
    // Check document scroll
    if (document.documentElement.scrollTop <= 0) return true;
    // Check container scroll
    if (containerRef.current && containerRef.current.scrollTop <= 0) return true;
    return false;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAtTop() && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0 && isAtTop()) {
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
      // Prevent native scroll while pulling
      if (distance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ touchAction: "pan-y" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute left-0 right-0 flex justify-center items-center transition-all duration-200 z-10"
        style={{
          top: 0,
          height: pullDistance,
          opacity: pullProgress,
        }}
      >
        <div
          className="bg-orange-500 rounded-full p-2"
          style={{
            transform: `rotate(${pullProgress * 360}deg)`,
          }}
        >
          <Loader2
            className={`w-5 h-5 text-white ${isRefreshing ? "animate-spin" : ""}`}
          />
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
