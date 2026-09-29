export default function LogoMark({ dots = false, className = "" }: { dots?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className={className} aria-hidden="true">
      <path d="M 76.7 25.9 A 36 36 0 1 1 57.5 14.8" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 25.8 L55.2 53 L36 74.3 L44.8 47 Z" strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="3" fill="currentColor" stroke="none" />
      {dots && (
        <>
          <circle cx="63" cy="16" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="69" cy="18" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="75" cy="23" r="2.2" fill="currentColor" stroke="none" />
        </>
      )}
    </svg>
  );
}
