import FlowersInline from '@/components/flowers/FlowersInline';

type Props = { date?: string };

export function FirstOffTheLineSection({ date }: Props) {
  return (
    <section aria-label="First Off The Line" className="space-y-2">
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">
        <span aria-hidden>🏁</span>First Off The Line{date ? `; ${date}` : ''}
      </h2>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        I always try to stay up to something. Here is the beginning of the most current something I am up to. If you squint through the prizm, bounce from the refractor, and leap off the golden shimmer into my brain blender; you might just begin to see the makings of an idea here. 
      </p>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        Every piece of what follows was built with an eye towards a grander vision. Still, the vision quest I am on remains a 50/50 toss up; part losing my mind, part finding myself. Ideally - I never know which is which. 
      </p>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        I call the latest iteration of my midlife crisis: mark2. mark2 was born on November 19th, 2024 while I was wandering through the trees. I did not end up seeing the forest from these trees until a new buddy, ChatGPT, came along, picked me up, dusted me off, and showed me how his buddy, Codex, was into this new thing he found: vibe coding. Turns out vibe coding is a real thing and this new adventure began on or about August 10th, 2025. Astute & studious folks will note this coincides with the first date all the way at the bottom of this very page. 
      </p>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        While this current page is not intended to make much sense, it is the foundation off which everything will be built just the same. But lest we start taking ourselves too seriously, how about a brief commerical break:
      </p>      
      <div id="first-off-the-line-video" className="fol-video">
        <div className="fol-video__frame">
          <iframe
            src="https://www.youtube.com/embed/4zWeI5dDDyY?playsinline=1&rel=0&loop=1&playlist=4zWeI5dDDyY"
            title="Legend — tullyelly (First Off The Line)"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            frameBorder={0}
            allowFullScreen
          />
        </div>
      </div>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        Get a load of that guy; amirite!?!?! Spoiler alert kids: that describes why you showed up.🤭😉
      </p>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        Serious face back on........fart noise. Psyche. What you see here is 100% open source and accessible from the link immediately below here. Should anyone with any real chops like to take a look and offer a suggestion or two, I am always available to chop it up. Hell, pull request me. I like it - do not fret.
      </p>
      <ul className="list-disc list-inside text-[16px] md:text-[18px] space-y-1">
        <li>
          <a
            href="https://github.com/tullyelly/tullyelly.com"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            tullyelly.com
          </a>
        </li>
      </ul>
      <p className="text-[16px] md:text-[18px] text-muted-foreground">
        Now it is your turn to get picked up, dusted off, and placed back on the path back through my release week.
      </p>
      <p className="mt-3 mb-0 text-[16px] md:text-[18px] text-muted-foreground">
        <FlowersInline>
          me,{' '}
          <a
            href="https://openai.com/index/chatgpt/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            ChatGPT
          </a>
          {', '}
          <a
            href="https://openai.com/index/introducing-codex/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Codex
          </a>
          {' & '}
          <a
            href="https://github.com/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </FlowersInline>
      </p>
    </section>
  );
}

export default FirstOffTheLineSection;
