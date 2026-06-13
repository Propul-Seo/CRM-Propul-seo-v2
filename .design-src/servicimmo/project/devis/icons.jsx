// Minimal Lucide-style icons (stroke, 24x24)
const makeIcon = (children) => ({ width=24, height=24, style={}, ...rest }) => (
  <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={rest.strokeWidth || 1.75} strokeLinecap="round" strokeLinejoin="round" style={style} {...rest}>
    {children}
  </svg>
);

const I = {
  home: makeIcon(<>
    <path d="M3 9.5 12 3l9 6.5"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>
  </>),
  key: makeIcon(<>
    <circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 21 2"/><path d="M17 6l3 3"/><path d="M14 9l2 2"/>
  </>),
  hammer: makeIcon(<>
    <path d="M14 4 20 10 17 13 11 7Z"/><path d="M11 7 4 14l3 3 7-7"/><path d="M6 16l-2 5 5-2"/>
  </>),
  building: makeIcon(<>
    <rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2"/>
  </>),
  help: makeIcon(<>
    <circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.3-1 1-1 1.7"/><circle cx="12" cy="17" r=".5" fill="currentColor"/>
  </>),
  check: makeIcon(<path d="M4 12l5 5L20 6"/>),
  chevron: makeIcon(<path d="M6 9l6 6 6-6"/>),
  arrow: makeIcon(<><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>),
  info: makeIcon(<><circle cx="12" cy="12" r="9"/><path d="M12 8v0M12 11v5"/></>),
  clock: makeIcon(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  sparkle: makeIcon(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></>),
  shield: makeIcon(<path d="M12 3 4 6v6c0 4.5 3.5 8 8 9 4.5-1 8-4.5 8-9V6l-8-3z"/>),
  ruler: makeIcon(<><path d="M3 17 17 3l4 4L7 21Z"/><path d="M7 17l2-2M10 14l2-2M13 11l2-2"/></>),
  fire: makeIcon(<path d="M12 3c1 3 4 4 4 8a4 4 0 1 1-8 0c0-1.5 1-2.5 2-3-1-2 0-4 2-5z"/>),
  zap: makeIcon(<path d="M13 3 4 14h7l-1 7 9-11h-7l1-7z"/>),
  plug: makeIcon(<><path d="M9 2v5M15 2v5M7 7h10v4a5 5 0 0 1-10 0z"/><path d="M12 16v5"/></>),
  map: makeIcon(<><path d="M12 21c-4-5-7-8-7-12a7 7 0 1 1 14 0c0 4-3 7-7 12z"/><circle cx="12" cy="9" r="2.5"/></>),
  tree: makeIcon(<><path d="M12 3c3 0 5 2.5 5 5 2 .5 3 2 3 4 0 2.5-2 4-4 4h-8c-2 0-4-1.5-4-4 0-2 1-3.5 3-4 0-2.5 2-5 5-5z"/><path d="M12 16v5"/></>),
  pencil: makeIcon(<><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></>),
  phone: makeIcon(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>),
  mail: makeIcon(<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></>),
  calendar: makeIcon(<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></>),
  lock: makeIcon(<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>),
  star: makeIcon(<path d="M12 3l2.6 6 6.4.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14l-5-4.5 6.4-.5z"/>),
};

Object.assign(window, { I });
