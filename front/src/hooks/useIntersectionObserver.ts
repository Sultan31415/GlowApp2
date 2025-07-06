import { useState, useEffect, RefObject } from 'react';

export function useIntersectionObserver(
  elementRef: RefObject<Element>,
  options: IntersectionObserverInit = { root: null, rootMargin: '0px', threshold: 0.1 }
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
} 