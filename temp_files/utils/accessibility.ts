/**
 * Utilitaires d'accessibilité pour l'application
 */

/**
 * Génère un ID unique pour les éléments d'interface
 * @param prefix Préfixe pour l'ID
 * @returns ID unique
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Crée un texte alternatif pour une image
 * @param imageName Nom de l'image
 * @param context Contexte de l'image
 * @returns Texte alternatif
 */
export function createAltText(imageName: string, context?: string): string {
  const cleanName = imageName
    .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  return context ? `${cleanName} - ${context}` : cleanName;
}

/**
 * Vérifie le contraste entre deux couleurs
 * @param foreground Couleur de premier plan (texte)
 * @param background Couleur d'arrière-plan
 * @returns Ratio de contraste et conformité WCAG
 */
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  isAA: boolean;
  isAAA: boolean;
} {
  // Convertir les couleurs hexadécimales en RGB
  const hexToRgb = (hex: string): number[] => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const formattedHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
    
    return result 
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : [0, 0, 0];
  };
  
  // Calculer la luminance relative
  const calculateLuminance = (rgb: number[]): number => {
    const [r, g, b] = rgb.map(c => {
      const channel = c / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const foregroundRgb = hexToRgb(foreground);
  const backgroundRgb = hexToRgb(background);
  
  const foregroundLuminance = calculateLuminance(foregroundRgb);
  const backgroundLuminance = calculateLuminance(backgroundRgb);
  
  const ratio = foregroundLuminance > backgroundLuminance
    ? (foregroundLuminance + 0.05) / (backgroundLuminance + 0.05)
    : (backgroundLuminance + 0.05) / (foregroundLuminance + 0.05);
  
  return {
    ratio,
    isAA: ratio >= 4.5,
    isAAA: ratio >= 7
  };
}

/**
 * Crée un attribut aria-label pour un élément
 * @param action Action de l'élément
 * @param context Contexte de l'action
 * @returns Texte pour aria-label
 */
export function createAriaLabel(action: string, context?: string): string {
  return context ? `${action} ${context}` : action;
}

/**
 * Vérifie si un élément est focusable
 * @param element Élément à vérifier
 * @returns true si l'élément est focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (!element) return false;
  
  // Éléments naturellement focusables
  if (['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'DETAILS'].includes(element.tagName)) {
    return !element.hasAttribute('disabled');
  }
  
  // Éléments avec tabindex
  if (element.hasAttribute('tabindex')) {
    const tabindex = parseInt(element.getAttribute('tabindex') || '');
    return !isNaN(tabindex) && tabindex >= 0;
  }
  
  return false;
}

/**
 * Crée un gestionnaire de touches pour l'accessibilité clavier
 * @param handlers Gestionnaires de touches
 * @returns Gestionnaire d'événement clavier
 */
export function createKeyboardHandler(
  handlers: Record<string, (event: React.KeyboardEvent) => void>
): (event: React.KeyboardEvent) => void {
  return (event: React.KeyboardEvent) => {
    const key = event.key.toLowerCase();
    
    if (handlers[key]) {
      handlers[key](event);
    } else if (handlers[`${event.ctrlKey ? 'ctrl+' : ''}${key}`]) {
      handlers[`${event.ctrlKey ? 'ctrl+' : ''}${key}`](event);
    }
  };
}

/**
 * Crée un gestionnaire d'événement pour les interactions accessibles
 * @param onClick Gestionnaire de clic
 * @returns Gestionnaires pour onClick et onKeyDown
 */
export function createAccessibleHandler(
  onClick: (event: React.MouseEvent | React.KeyboardEvent) => void
): {
  onClick: (event: React.MouseEvent) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
} {
  return {
    onClick,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick(event);
      }
    }
  };
}

/**
 * Vérifie si le mode contraste élevé est activé
 * @returns true si le mode contraste élevé est activé
 */
export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;
  
  const highContrastQuery = window.matchMedia('(forced-colors: active)');
  return highContrastQuery.matches;
}

/**
 * Vérifie si le mode réduction de mouvement est activé
 * @returns true si le mode réduction de mouvement est activé
 */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return reducedMotionQuery.matches;
}