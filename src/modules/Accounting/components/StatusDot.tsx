export function StatusDot({ color = 'emerald' }: { color?: 'emerald' | 'rose' | 'cyan' | 'amber' }) {
  const colors = {
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
    amber: 'bg-amber-500',
  };

  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[color]}`} />
    </span>
  );
}
