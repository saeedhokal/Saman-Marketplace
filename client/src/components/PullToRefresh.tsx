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
  const startScrollTop = useRef(0);

  const PULL_THRESHOLD = 70;
  const MAX_PULL = 100;

  // Detect if we're in a Capacitor/native app
  const isNativeApp = typeof (window as any).Capacitor !== 'undefined';

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    
    // Get current scroll position
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    startScrollTop.current = scrollTop;
    
    // Only activate if at top
    if (scrollTop <= 5) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    
    // Only pull if we're at the top and pulling down
    if (diff > 0 && scrollTop <= 5) {
      const distance = Math.min(diff * 0.4, MAX_PULL);
      setPullDistance(distance);
      
      // Prevent native scroll/bounce while pulling
      if (distance > 5) {
        e.preventDefault();
      }
    } else if (diff < 0) {
      // User is scrolling up, cancel pull
      setIsPulling(false);
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing]);

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

  // Use native event listeners for better iOS support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add event listeners with passive: false to allow preventDefault
    const options = { passive: false };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ 
        overscrollBehavior: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Pull indicator - fixed at top */}
      <div
        className="fixed left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
        style={{
          top: Math.max(0, pullDistance - 50),
          opacity: pullProgress,
          transition: isPulling ? 'none' : 'all 0.2s ease-out',
        }}
      >
        <div
          className="bg-orange-500 rounded-full p-2 shadow-lg"
          style={{
            transform: `scale(${0.5 + pullProgress * 0.5}) rotate(${pullProgress * 360}deg)`,
            transition: isPulling ? 'none' : 'all 0.2s ease-out',
          }}
        >
          <Loader2
            className={`w-5 h-5 text-white ${isRefreshing ? "animate-spin" : ""}`}
          />
        </div>
      </div>
      
      {/* Content with pull transform */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
