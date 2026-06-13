// Fonction pour supprimer les accents
export const removeAccents = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
    .toLowerCase(); // Convertit en minuscules
};

// Fonction utilitaire pour accéder aux champs imbriqués
export const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
};

// Tests de la fonction (pour développement)
export const testAccentRemoval = () => {
  const testCases = [
    { input: "Jérôme", expected: "jerome" },
    { input: "Éloïse", expected: "eloise" },
    { input: "François", expected: "francois" },
    { input: "Noël", expected: "noel" },
    { input: "André", expected: "andre" },
    { input: "René", expected: "rene" },
    { input: "Céline", expected: "celine" }
  ];
  
  testCases.forEach(({ input, expected }) => {
    const result = removeAccents(input);
    console.log(`${input} → ${result} (expected: ${expected})`);
  });
};
