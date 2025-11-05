// pages/mine/index.tsx
import { useEffect } from "react";

export default function MineRedirect() {
  useEffect(() => {
    window.location.replace("/dashboard");
  }, []);
  return null;
}
