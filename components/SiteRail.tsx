"use client";

import { useEffect, useState } from "react";

export default function SiteRail() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem("site-rail-dismissed");
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    window.localStorage.setItem("site-rail-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="site-rail" role="region" aria-label="Site announcement">
      <div className="container rail-inner">
        <p className="rail-message">
          Limited Promo • Bucks Green announcement rail
        </p>
        <button className="rail-close" onClick={dismiss} aria-label="Dismiss announcement">
          ×
        </button>
      </div>
    </div>
  );
}
