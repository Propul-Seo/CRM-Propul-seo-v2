// Helper pour l'apparition progressive question par question dans une étape.
// On passe la liste des "validations" (true = question répondue) dans l'ordre.
// Le hook retourne le nombre de questions à révéler :
//   - La question 1 est toujours visible (revealed >= 1)
//   - La question N+1 apparaît uniquement si la question N est remplie.
//
// Pattern d'usage :
//   const revealed = useProgressiveReveal([
//     !!draft.full_name && !!draft.email && !!draft.phone, // bloc coordonnées
//     !!draft.sector,                                       // secteur
//   ]);
//   return (
//     <>
//       {revealed >= 1 && <ConditionalBranch show><CoordsBlock /></ConditionalBranch>}
//       {revealed >= 2 && <ConditionalBranch show><SectorBlock /></ConditionalBranch>}
//     </>
//   );
//
// Note : la liste passée représente les questions 1..N-1 (la dernière n'a pas
// besoin de "débloquer" quoi que ce soit après elle). Mais on accepte toutes
// les validations pour rester intuitif côté appel — on s'arrête naturellement.

export function useProgressiveReveal(checks: boolean[]): number {
  let revealed = 1;
  for (let i = 0; i < checks.length; i++) {
    if (checks[i]) revealed = Math.max(revealed, i + 2);
    else break;
  }
  return Math.min(revealed, checks.length + 1);
}
