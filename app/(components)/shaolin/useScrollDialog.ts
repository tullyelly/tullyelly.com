"use client";

import { useCallback, useState } from "react";

export function useScrollDialog() {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | number | null>(null);
  const openWithId = useCallback((nextId: string | number) => {
    setId(nextId);
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  return { open, setOpen, id, openWithId, close };
}
