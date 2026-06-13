export function Orb({ style }: { style: React.CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }}
    />
  )
}
