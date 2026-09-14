"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Route transition when navigating client-side (e.g. Home → Community).
 * The first page you land on is not animated so nothing feels hidden.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const [transitionCount, setTransitionCount] = useState(0);

  useEffect(() => {
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return;
    }
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setTransitionCount((c) => c + 1);
    }
  }, [pathname]);

  const shouldAnimate = transitionCount > 0;

  return (
    <div
      key={pathname}
      className={shouldAnimate ? "page-route-transition" : undefined}
    >
      {children}
    </div>
  );
}
