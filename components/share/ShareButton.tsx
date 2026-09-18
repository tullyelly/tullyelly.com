"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type ShareButtonProps = {
  title: string;
  description?: string;
  className?: string;
};

function currentShareUrl(): string {
  const canonical = document.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )?.href;

  return canonical || window.location.href;
}

function isShareCancellation(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

export default function ShareButton({
  title,
  description,
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    [],
  );

  function showCopied() {
    setCopied(true);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1600);
    toast({ title: "Link copied", duration: 1600 });
  }

  async function copyUrl(url: string) {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API unavailable");
    }

    await navigator.clipboard.writeText(url);
    analytics.track("share.copy_link");
    showCopied();
  }

  async function handleShare() {
    const url = currentShareUrl();

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title,
          url,
          ...(description ? { text: description } : {}),
        });
        analytics.track("share.native");
        return;
      } catch (error) {
        if (isShareCancellation(error)) return;
      }
    }

    try {
      await copyUrl(url);
    } catch {
      toast({
        title: "Could not share this page",
        description: "Copy the address from your browser and try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Button
      type="button"
      variant="default"
      size="sm"
      className={cn(
        "min-w-24 bg-[var(--blue)] text-white hover:bg-[var(--blue-contrast)]",
        className,
      )}
      onClick={handleShare}
      aria-label={copied ? "Link copied" : "Share this page"}
    >
      {copied ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
