"use client";
import { useEffect, useState } from "react";

type Props = { value?: string | null };

export default function TimeStamp({ value }: Props) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    if (!value) return setText("");
    const d = new Date(value);
    setText(d.toLocaleString());
  }, [value]);

  return <span suppressHydrationWarning>{text}</span>;
}
