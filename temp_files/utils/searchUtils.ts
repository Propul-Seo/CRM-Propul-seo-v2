// Fonction pour supprimer les accents
export const removeAccents = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
    .toLowerCase(); // Convertit en minuscules
};

// Fonction utilitaire pour accéder aux champs imbriqués
export const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
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
