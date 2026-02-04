import { useState, useRef, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const canPull = useRef(false);

  const PULL_THRESHOLD = 55;
  const MAX_PULL = 80;

  // Detect iOS/Capacitor
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

  const getScrollTop = useCallback(() => {
    return Math.max(
      window.scrollY || 0,
      window.pageYOffset || 0,
      document.documentElement?.scrollTop || 0,
      document.body?.scrollTop || 0
    );
  }, []);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      
      const scrollTop = getScrollTop();
      
      // Allow pull if at very top
      if (scrollTop <= 1) {
        startY.current = e.touches[0].clientY;
        canPull.current = true;
      } else {
        canPull.current = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!canPull.current || isRefreshing) return;
      
      const scrollTop = getScrollTop();
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;
      
      // Only activate if still at top and pulling down
      if (diff > 0 && scrollTop <= 1) {
        pulling.current = true;
        setIsPulling(true);
        const distance = Math.min(diff * 0.4, MAX_PULL);
        setPullDistance(distance);
        
        // Prevent default scroll when pulling
        if (distance > 5) {
          e.preventDefault();
        }
      } else {
        // User scrolled or pulled up - cancel
        if (pulling.current) {
          pulling.current = false;
          setIsPulling(false);
          setPullDistance(0);
        }
        canPull.current = false;
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) {
        canPull.current = false;
        setIsPulling(false);
        return;
      }
      
      const distance = pullDistance;
      pulling.current = false;
      canPull.current = false;
      setIsPulling(false);
      
      if (distance >= PULL_THRESHOLD && !isRefreshing) {
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
    };

    // Use document-level listeners for iOS Capacitor
    const target = isCapacitor ? document : (containerRef.current || document);
    
    target.addEventListener('touchstart', onTouchStart as any, { passive: true });
    target.addEventListener('touchmove', onTouchMove as any, { passive: false });
    target.addEventListener('touchend', onTouchEnd as any, { passive: true });
    target.addEventListener('touchcancel', onTouchEnd as any, { passive: true });

    return () => {
      target.removeEventListener('touchstart', onTouchStart as any);
      target.removeEventListener('touchmove', onTouchMove as any);
      target.removeEventListener('touchend', onTouchEnd as any);
      target.removeEventListener('touchcancel', onTouchEnd as any);
    };
  }, [isRefreshing, onRefresh, pullDistance, getScrollTop, isCapacitor]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  // Only show indicator if actively pulling (distance > threshold to be visible)
  const showIndicator = (isPulling || isRefreshing) && pullDistance > 10;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Pull indicator - only show when actively pulling */}
      {showIndicator && (
        <div
          className="fixed left-1/2 z-[9999] pointer-events-none"
          style={{
            top: 50 + pullDistance * 0.5,
            transform: 'translateX(-50%)',
          }}
        >
          <div
            className="bg-orange-500 rounded-full p-2 shadow-lg"
            style={{
              opacity: pullProgress,
              transform: `scale(${0.5 + pullProgress * 0.5}) rotate(${pullProgress * 360}deg)`,
            }}
          >
            <Loader2
              className={`w-5 h-5 text-white ${isRefreshing ? "animate-spin" : ""}`}
            />
          </div>
        </div>
      )}
      
      {/* Content - only transform when actively pulling, snap back instantly */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : 'none',
          transition: pullDistance > 0 ? 'none' : 'transform 0.1s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
