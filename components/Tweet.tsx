type XEmbedProps = {
  id: string;
};

export function XEmbed({ id }: XEmbedProps) {
  const normalizedId = /^\d+$/.test(id) ? id : "";

  if (!normalizedId) {
    return null;
  }

  return (
    <div className="mx-auto my-6 w-full max-w-[550px] overflow-hidden rounded-xl border border-border bg-white">
      <iframe
        title={`Post on X ${normalizedId}`}
        src={`https://platform.twitter.com/embed/Tweet.html?id=${normalizedId}&theme=light`}
        className="block min-h-[250px] w-full border-0"
        loading="lazy"
        allowFullScreen
      />
      <p className="border-t border-border px-4 py-2 text-sm text-muted-foreground">
        <a
          href={`https://x.com/i/status/${normalizedId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link-blue"
        >
          Open this post on X
        </a>
      </p>
    </div>
  );
}
