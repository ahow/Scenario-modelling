import { memo } from 'react';

/**
 * Schroders wordmark logo.
 * Uses the SVG file from /public for reliable rendering.
 * In dark mode, applies CSS invert filter to flip the navy to white.
 */
export const SchrodersLogo = memo(function SchrodersLogo({
  className = '',
}: {
  className?: string;
}) {
  return (
    <img
      src="/schroders-wordmark.svg"
      alt="Schroders"
      className={`dark:invert ${className}`}
    />
  );
});
