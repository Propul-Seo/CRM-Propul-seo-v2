/**
 * Utilitaires de performance
 * 
 * Outils pour optimiser et mesurer les performances de l'application
 */

import { logger } from './logger';

/**
 * Débounce function pour optimiser les inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function pour limiter les appels fréquents
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Mesure les performances d'une fonction
 */
export function measurePerformance(
  _label: string,
  fn: () => void
): void {
  if (process.env.NODE_ENV === 'development') {
    // En développement, on peut mesurer si nécessaire
    fn();
  } else {
    fn();
  }
}

/**
 * Async version de mesure de performance
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    logger.perf(`${label}: ${(end - start).toFixed(2)} ms`, () => {});
  }
  
  return result;
}

/**
 * Virtual scrolling helper pour optimiser les listes longues
 */
export function virtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
): { visibleItems: T[]; startIndex: number; endIndex: number } {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  return {
    visibleItems: items.slice(startIndex, endIndex),
    startIndex,
    endIndex,
  };
}

/**
 * Lazy load images avec intersection observer
 */
export function useLazyImage(element: HTMLImageElement | null, src: string): void {
  if (!element) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          element.src = src;
          observer.disconnect();
        }
      });
    },
    { rootMargin: '50px' }
  );

  observer.observe(element);
}

/**
 * Précharger les ressources critiques
 */
export function preloadResource(url: string, as: string = 'script'): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = as;
    link.onload = () => resolve();
    link.onerror = () => reject();
    document.head.appendChild(link);
  });
}

/**
 * Optimiser les re-renders avec shallow comparison
 */
export function shallowEqual(obj1: Record<string, unknown> | null | undefined, obj2: Record<string, unknown> | null | undefined): boolean {
  if (obj1 === obj2) return true;
  
  if (!obj1 || !obj2) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false;
  }
  
  return true;
}

/**
 * Cleanup function pour éviter les memory leaks
 */
export function createCleanup(): () => void {
  const cleanupFunctions: (() => void)[] = [];

  const cleanup = () => {
    cleanupFunctions.forEach(fn => fn());
    cleanupFunctions.length = 0;
  };

  return cleanup;
}

/**
 * Batch updates pour optimiser les mises à jour d'état
 */
export class BatchUpdate<T> {
  private updates: Partial<T>[] = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private updateFn: (updates: Partial<T>[]) => void,
    private delay: number = 0
  ) {}

  add(update: Partial<T>) {
    this.updates.push(update);

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush() {
    if (this.updates.length > 0) {
      this.updateFn(this.updates);
      this.updates = [];
    }
  }

  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

export default {
  debounce,
  throttle,
  measurePerformance,
  measureAsyncPerformance,
  virtualScroll,
  useLazyImage,
  preloadResource,
  shallowEqual,
  createCleanup,
  BatchUpdate,
};

