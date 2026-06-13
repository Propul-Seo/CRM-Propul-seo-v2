/**
 * Utilitaires pour l'optimisation des performances
 */

/**
 * Débounce une fonction pour limiter son exécution
 * @param func Fonction à débouncer
 * @param wait Temps d'attente en ms
 * @returns Fonction debouncée
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle une fonction pour limiter sa fréquence d'exécution
 * @param func Fonction à throttler
 * @param limit Limite de temps en ms
 * @returns Fonction throttlée
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: number;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Mesure le temps d'exécution d'une fonction
 * @param name Nom de la mesure
 * @param func Fonction à mesurer
 * @returns Résultat de la fonction
 */
export function measurePerformance<T>(name: string, func: () => T): T {
  const start = performance.now();
  const result = func();
  const end = performance.now();
  
  console.log(`[Performance] ${name} took ${Math.round(end - start)}ms`);
  return result;
}

/**
 * Memoize une fonction pour mettre en cache ses résultats
 * @param func Fonction à memoizer
 * @returns Fonction memoizée
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Optimise le rendu des listes en générant des clés stables
 * @param item Item de la liste
 * @param index Index de l'item
 * @param prefix Préfixe pour la clé
 * @returns Clé stable pour l'item
 */
export function getStableKey(item: any, index: number, prefix: string = 'item'): string {
  if (item.id) return `${prefix}_${item.id}`;
  if (item.key) return `${prefix}_${item.key}`;
  return `${prefix}_${index}`;
}

/**
 * Détecte si le navigateur est en mode économie d'énergie
 * @returns true si le navigateur est en mode économie d'énergie
 */
export function isLowPowerMode(): boolean {
  // Détection basique basée sur la batterie API
  if ('getBattery' in navigator) {
    return (navigator as any).getBattery().then((battery: any) => {
      return battery.charging === false && battery.level < 0.2;
    });
  }
  return false;
}

/**
 * Optimise le chargement des images
 * @param url URL de l'image
 * @param options Options de chargement
 * @returns Promise avec l'URL de l'image
 */
export function optimizeImageLoading(
  url: string,
  options: { width?: number; quality?: number } = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    
    // Ajouter des paramètres d'optimisation si nécessaire
    if (url.includes('?')) {
      img.src = url;
    } else {
      const params = new URLSearchParams();
      if (options.width) params.append('w', options.width.toString());
      if (options.quality) params.append('q', options.quality.toString());
      
      img.src = params.toString() ? `${url}?${params.toString()}` : url;
    }
  });
}