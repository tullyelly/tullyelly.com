import { cn } from "@/lib/utils";

export type YouTubeVideoProps = {
  id: string;
  orientation?: "landscape" | "portrait";
  playlist?: string;
  loop?: boolean;
  className?: string;
};

export default function YouTubeVideo({
  id,
  orientation = "landscape",
  playlist,
  loop = false,
  className,
}: YouTubeVideoProps) {
  const params = new URLSearchParams({
    modestbranding: "1",
    rel: "0",
  });

  if (playlist || loop) {
    params.set("playlist", playlist ?? id);
  }

  if (loop) {
    params.set("loop", "1");
  }

  const embedSrc = `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;

  return (
    <div
      className={cn(
        "relative",
        orientation === "portrait"
          ? "mx-auto w-full max-w-[360px] aspect-[9/16]"
          : "w-full aspect-video",
        className,
      )}
    >
      <iframe
        src={embedSrc}
        title="YouTube video player"
        className="absolute inset-0 w-full h-full rounded-lg"
        frameBorder={0}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
