// components/ClientTime.tsx
"use client";
import React from "react";

/**
 * ClientTime
 * Renders a localized date/time string on the client to avoid
 * server/client hydration mismatches that happen when formatting
 * at render-time on the server.
 *
 * Usage:
 *   <ClientTime value={n.created_at} className="text-xs text-neutral-500" />
 */
export default function ClientTime({
  value,
  className = "",
  options,
}: {
  value?: string | null;
  className?: string;
  /** Optional Intl.DateTimeFormatOptions */
  options?: Intl.DateTimeFormatOptions;
}) {
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    if (!value) return;
    const d = new Date(value);
    // Feel free to change locale/timeZone as needed
    const fmt = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      ...(options || {}),
    });
    setText(fmt.format(d));
  }, [value, options]);

  return (
    <time
      dateTime={value || undefined}
      suppressHydrationWarning
      className={className}
    >
      {text}
    </time>
  );
}
