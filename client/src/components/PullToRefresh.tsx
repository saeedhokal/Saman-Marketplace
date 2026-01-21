import { useState, useRef, useCallback, useEffect } from "react";
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
  const pulling = useRef(false);

  const PULL_THRESHOLD = 60;
  const MAX_PULL = 90;

  const isAtTop = useCallback(() => {
    // Check all possible scroll positions
    const windowScroll = window.scrollY || window.pageYOffset || 0;
    const docScroll = document.documentElement?.scrollTop || 0;
    const bodyScroll = document.body?.scrollTop || 0;
    return windowScroll <= 2 && docScroll <= 2 && bodyScroll <= 2;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    if (isAtTop()) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
      setIsPulling(true);
    }
  }, [isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && isAtTop()) {
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
      
      if (distance > 10) {
        e.preventDefault();
        e.stopPropagation();
      }
    } else if (diff < -10) {
      pulling.current = false;
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [isRefreshing, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    
    pulling.current = false;
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
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const touchMoveOptions = { passive: false, capture: true };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, touchMoveOptions);
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'auto',
      }}
    >
      {pullDistance > 0 && (
        <div
          className="fixed left-0 right-0 flex justify-center items-center z-[100] pointer-events-none"
          style={{
            top: 60,
            opacity: pullProgress,
          }}
        >
          <div
            className="bg-orange-500 rounded-full p-2.5 shadow-lg"
            style={{
              transform: `scale(${0.6 + pullProgress * 0.4}) rotate(${pullProgress * 360}deg)`,
            }}
          >
            <Loader2
              className={`w-5 h-5 text-white ${isRefreshing ? "animate-spin" : ""}`}
            />
          </div>
        </div>
      )}
      
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
