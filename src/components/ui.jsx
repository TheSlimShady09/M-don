import { useEffect, useRef, useState } from 'react';

/** Wrapper: max width + side gutter used by every section */
export function Wrap({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`mx-auto w-full max-w-[1440px] px-[clamp(16px,4vw,56px)] ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Photo slot. Shows the diamond mark and the shot brief until a real photo loads. */
export function Media({ src, alt = '', ph, ratio, tone = 'dark', className = '', imgClassName = '', eager = false, style }) {
  const [state, setState] = useState('loading');
  const img = useRef(null);

  useEffect(() => {
    setState('loading');
    const el = img.current;
    if (el && el.complete) setState(el.naturalWidth > 0 ? 'loaded' : 'failed');
  }, [src]);

  return (
    <div
      className={`media ${tone === 'light' ? 'media-light' : tone === 'onred' ? 'media-onred' : ''} ${className}`}
      style={{ aspectRatio: ratio, ...style }}
      data-ph={ph}
      data-loaded={state === 'loaded' || undefined}
    >
      {src && state !== 'failed' && (
        <img
          ref={img}
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          className={`absolute inset-0 z-[1] h-full w-full object-cover transition-[opacity,transform] duration-[800ms] ease-[var(--ease-brand)] ${
            state === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
        />
      )}
    </div>
  );
}

/** Fades content up once it scrolls into view */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setShown(true); io.disconnect(); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${shown ? 'is-in' : ''} ${className}`} style={{ '--d': `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

export const Kilim = ({ dark = false, className = '' }) => (
  <div aria-hidden="true" className={`kilim ${dark ? 'kilim-dark' : ''} ${className}`} />
);

export const Zigzag = ({ className = '' }) => <div aria-hidden="true" className={`zigzag ${className}`} />;

export const Arrow = () => <span className="arr" aria-hidden="true">→</span>;

/** The sënduk (carved dowry chest) used as the cart icon */
export function Chest({ className = '' }) {
  return (
    <svg viewBox="0 0 30 26" aria-hidden="true" className={`h-[26px] w-[30px] overflow-visible fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.1] ${className}`}>
      <g className="chest__lid">
        <path d="M3 10V7.5C3 5 5 3 7.5 3h15C25 3 27 5 27 7.5V10Z" />
        <path d="M13.5 10V7.5h3V10" />
      </g>
      <path d="M3 10h24v11H3Z" />
      <path d="M15 12.5 18 15.5 15 18.5 12 15.5Z" />
      <path d="M15 14.3 16.2 15.5 15 16.7 13.8 15.5Z" className="fill-flame stroke-none" />
      <path d="M7.5 13.5 9.5 15.5 7.5 17.5 5.5 15.5ZM22.5 13.5 24.5 15.5 22.5 17.5 20.5 15.5Z" />
      <path d="M5 21v2.5M25 21v2.5" />
    </svg>
  );
}

/** Nested kilim diamond used as a mark */
export function DiamondMark({ className = '' }) {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" className={`fill-none stroke-current [stroke-width:1] ${className}`}>
      <path d="M36 2 70 36 36 70 2 36Z" />
      <path d="M36 14 58 36 36 58 14 36Z" />
      <path d="M36 26 46 36 36 46 26 36Z" />
      <path d="M36 32 40 36 36 40 32 36Z" className="fill-current stroke-none" />
    </svg>
  );
}
