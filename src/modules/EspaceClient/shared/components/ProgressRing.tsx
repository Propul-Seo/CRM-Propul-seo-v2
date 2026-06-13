interface ProgressRingProps {
  /** Pourcentage 0–100. */
  value: number;
  /** Diamètre du SVG en px. */
  size?: number;
  /** Épaisseur du trait en px. */
  stroke?: number;
  /** Libellé sous la valeur (ex. « avancement »). Masqué si vide. */
  label?: string;
  /** Taille de la valeur centrale en px (défaut : proportionnel). */
  valueSize?: number;
}

// Anneau de progression en SVG pur (zéro dépendance). Track en violet pâle,
// remplissage en accent unique. Valeur centrale en Space Grotesk tabular-nums.
// Theme-aware : consomme les tokens --ps-*.
export function ProgressRing({
  value,
  size = 120,
  stroke = 9,
  label = 'avancement',
  valueSize,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);
  const fontSize = valueSize ?? Math.round(size * 0.2);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      role="img"
      aria-label={`${clamped}% ${label}`.trim()}
      className="shrink-0"
    >
      <circle cx={cx} cy={cx} r={r} stroke="var(--ps-primary-subtle)" strokeWidth={stroke} />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        stroke="var(--ps-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 600ms var(--ps-ease-out)' }}
      />
      <text
        x="50%"
        y={label ? '46%' : '52%'}
        textAnchor="middle"
        dominantBaseline="middle"
        className="ps-num font-[family-name:var(--ps-font-display)]"
        fontSize={fontSize}
        fontWeight={700}
        fill="var(--ps-fg)"
      >
        {clamped}%
      </text>
      {label && (
        <text
          x="50%"
          y="64%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-[family-name:var(--ps-font-sans)]"
          fontSize={Math.round(size * 0.083)}
          fill="var(--ps-fg-muted)"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
