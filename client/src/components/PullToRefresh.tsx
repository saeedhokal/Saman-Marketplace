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

  const getScrollTop = useCallback(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      return container.scrollTop;
    }
    return 0;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;

      const scrollTop = getScrollTop();

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

      if (diff > 0 && scrollTop <= 1) {
        pulling.current = true;
        setIsPulling(true);
        const distance = Math.min(diff * 0.4, MAX_PULL);
        setPullDistance(distance);

        if (distance > 5) {
          e.preventDefault();
        }
      } else {
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

      const dist = pullDistance;
      pulling.current = false;
      canPull.current = false;
      setIsPulling(false);

      if (dist >= PULL_THRESHOLD && !isRefreshing) {
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

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isRefreshing, onRefresh, pullDistance, getScrollTop]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showIndicator = (isPulling || isRefreshing) && pullDistance > 10;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
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
