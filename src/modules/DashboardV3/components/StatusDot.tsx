interface StatusDotProps {
  status: 'active' | 'warning' | 'error' | 'idle';
}

const colors = {
  active: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  idle: 'bg-muted-foreground',
};

export function StatusDot({ status }: StatusDotProps) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  );
}
