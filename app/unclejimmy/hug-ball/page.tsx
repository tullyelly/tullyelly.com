import Link from "next/link";
import Image from "next/image";
import { canonicalUrl } from "@/lib/share/canonicalUrl";

const pageTitle = "hug ball";
const pageDescription = "What is a hug ball? Can we ever truly know?";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: canonicalUrl("unclejimmy/hug-ball") },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/unclejimmy/hug-ball",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: pageTitle,
    description: pageDescription,
  },
};

export default function UncleJimmyHugBallPage() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          What is a hug ball?
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          A hug ball is similar to a sports huddle, except that rather than
          saying <i>1, 2, 3......Terrors!</i>, or whatever the catch phrase of
          the day is, you just yell hug ball. Then, squeeze all of your
          teammates of the moment, and jump around like an idiot. Being an idiot
          is a key requirement.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/unclejimmy/hug-ball/hug-ball.webp"
              alt="Milwaukee Bucks hug ball"
              width={1920}
              height={2550}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              Milwaukee Bucks hug ball
            </figcaption>
          </figure>
        </div>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Hug balls are meant to be joyful in nature, even when triggered by
          something that is, well, not joyful. Perhaps someone is sad - do not
          be deterred. You and your homies should circle around the poor soul,
          have everyone hug tight, scream “hug ball,” jump around like said
          idiot, and shake the bad juju out of the system. There is nothing
          beyond the help of a hug ball.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          I don&rsquo;t recall the specific origin of the term &ldquo;hug
          ball,&rdquo; so just imagine an epic tale filled with love, hugs, and
          balls. The heroes of this tale are{" "}
          <Link href="/shaolin/tags/nikkigirl">nikkigirl</Link>,{" "}
          <Link href="/shaolin/tags/bonnibel">bonnibel</Link>,{" "}
          <Link href="/shaolin/tags/lulu">lulu</Link>,{" "}
          <Link href="/shaolin/tags/eeeeeeeemma">eeeeeeeemma</Link>,{" "}
          <Link href="/shaolin/tags/jeff-meff">jeff meff</Link>, and me,{" "}
          <Link href="/unclejimmy">unclejimmy</Link>. Rumors of the fabled hug
          ball soon spread far and wide, with reports of additional apostles
          helping this ball of hug sweep the nation. Dozens, perhaps hundreds,
          have been infected by this virus of love.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          If you have been ball-hugged by any of the hug ball founding fathers,
          you are a knight of the hug ball, free to continue growing the size of
          our max hug ball capacity. If you are reading this message, you’re
          kinda in the club and may practice on your own time. Just know that
          nobody asks for the hug ball. The hug ball must spring forth naturally
          and without thirstiness.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          TL;DR: IYKYK and NYK.
        </p>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">
          THE hug ball.
        </h2>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          Within the past six months or so, I&rsquo;ve started to make a ball
          out of all the tape that I get from my{" "}
          <Link href="/shaolin/tags/tcdb">TCDb</Link> trading partners, along
          with the excess that naturally happens in my collecting process. This
          ball will now officially become THE hug ball, and we will track its
          growth here.
        </p>
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          As of 2025-11-13, THE hug ball is about the size of a baseball and
          weighs 2.7 ounces.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <figure className="rounded-2xl border border-border/40 bg-white p-2 shadow-sm">
            <Image
              src="/images/optimized/unclejimmy/hug-ball/THE-hug-ball.webp"
              alt="A ball of tape. THE hug ball."
              width={1920}
              height={2550}
              sizes="(max-width: 640px) 100vw, 50vw"
              className="h-auto w-full rounded-xl object-cover"
            />
            <figcaption className="sr-only">
              A ball of tape. THE hug ball.
            </figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
