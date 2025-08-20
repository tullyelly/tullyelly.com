"use client";

import { useEffect, useState } from "react";

interface SiteRailProps {
  message?: string;
}

export default function SiteRail({ message }: SiteRailProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    const dismissed = window.localStorage.getItem("site-rail-dismissed");
    if (!dismissed) {
      setVisible(true);
    }
  }, [message]);

  const dismiss = () => {
    window.localStorage.setItem("site-rail-dismissed", "1");
    setVisible(false);
  };

  if (!message) {
    return <div className="site-rail" style={{ display: "none" }} />;
  }

  if (!visible) return null;

  return (
    <div className="site-rail" role="region" aria-label="Site announcement">
      <div className="container rail-inner">
        <p className="rail-message">{message}</p>
        <button className="rail-close" onClick={dismiss} aria-label="Dismiss announcement">
          ×
        </button>
      </div>
    </div>
  );
}
