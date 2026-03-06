export default function FullBleedPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-2 md:mx-0">
      <article className="w-full max-w-none md:max-w-3xl md:mx-auto space-y-10 mt-8 md:mt-10">
        {children}
      </article>
    </div>
  );
}
