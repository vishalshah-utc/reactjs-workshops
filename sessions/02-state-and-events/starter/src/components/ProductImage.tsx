import { useId } from 'react';
import { cn } from '@/lib/utils';

const PALETTES: Array<[string, string]> = [
  ['#0f172a', '#334155'], ['#1e3a5f', '#2563eb'], ['#134e4a', '#0d9488'],
  ['#3f2d1a', '#b45309'], ['#4a1d3f', '#be185d'], ['#1c3a1c', '#15803d'],
  ['#3b1f47', '#7c3aed'], ['#4a2019', '#dc2626'], ['#1a3a44', '#0891b2'],
  ['#42331a', '#ca8a04'],
];

/** Tiny string hash, so the same product always gets the same picture. */
function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

interface ProductImageProps {
  /** Used to pick a deterministic colour and derive the initials. */
  seed: string;
  /** Human-readable label for the initials and the accessible name. */
  name: string;
  /** From Session 3 onward the API supplies a real URL; before that, none. */
  src?: string;
  className?: string;
}

/**
 * A product image.
 *
 * With no `src` it draws a deterministic gradient placeholder inline — no
 * network, no broken-image icons, no dependency on being online. From Session
 * 3, real URLs arrive from the API and it renders an <img> instead. The
 * calling code never changes.
 *
 * Note `useId()`: two of these on one page would otherwise both define an SVG
 * gradient with id="g", and the second would silently win for both. `useId`
 * generates an id that is unique per component instance and stable across
 * server and client rendering.
 */
export function ProductImage({ seed, name, src, className }: ProductImageProps) {
  const gradientId = useId();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn('h-full w-full object-cover', className)}
      />
    );
  }

  const seedValue = hash(seed);
  const [from, to] = PALETTES[seedValue % PALETTES.length];
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <svg
      viewBox="0 0 300 300"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label={name}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={gradientId} gradientTransform={`rotate(${seedValue % 360})`}>
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill={`url(#${gradientId})`} />
      <circle cx={seedValue % 300} cy={(seedValue >> 8) % 300} r={60 + ((seedValue >> 16) % 80)} fill="#fff" opacity="0.05" />
      <circle cx={(seedValue >> 4) % 300} cy={(seedValue >> 12) % 300} r={40 + ((seedValue >> 20) % 60)} fill="#fff" opacity="0.05" />
      <text
        x="50%" y="50%"
        fontSize="92" fontWeight="700" fill="#fff" fillOpacity="0.92"
        textAnchor="middle" dominantBaseline="central"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}
