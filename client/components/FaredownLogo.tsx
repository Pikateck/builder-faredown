// client/components/FaredownLogo.tsx
export function FaredownLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo/faredown-logo.png?v=1"
      alt="Faredown Logo"
      className={`h-16 w-auto block object-contain ${className}`}
      loading="eager"
      decoding="async"
    />
  );
}
