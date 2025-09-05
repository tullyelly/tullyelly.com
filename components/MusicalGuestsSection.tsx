import Link from 'next/link';
import FlowersInline from '@/components/flowers/FlowersInline';

type Props = { date?: string };

export function MusicalGuestsSection({ date }: Props) {
  return (
    <section aria-label="Musical Guests" className="space-y-2">
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">
        <span aria-hidden>🎤</span>Musical Guests{date ? `; ${date}` : ''}
      </h2>
      <p className="text-sm md:text-[15px] text-muted-foreground">If you are around me long enough, you will be subjected to music takes. Wu-Tang is for the children, so please Run The Jewels fast.</p>
      <ul className="list-disc list-inside text-sm md:text-[15px] space-y-1">
        <li>
          <Link href="/heels-have-eyes" className="underline hover:no-underline">
            HEELS HAVE EYES
          </Link>
        </li>
        <li>
          <Link href="/roadwork-rappin" className="underline hover:no-underline">
            Roadwork Rappin&lsquo;
          </Link>
        </li>
      </ul>
      <p className="mt-3 text-sm md:text-[15px] text-muted-foreground">
        <FlowersInline>
          <a
            href="https://www.instagram.com/westsidegunn/?hl=en"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            westside gunn
          </a>
          {", "}
          <a
            href="https://www.instagram.com/aesoprockwins/?hl=en"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            aesop rock
          </a>
          {", "}
          <a
            href="https://www.instagram.com/wutangclan/?hl=en"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            wu-tang clan
          </a>
          {" & "}
          <a
            href="https://www.instagram.com/runthejewels/?hl=en"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            run the jewels
          </a>
        </FlowersInline>
      </p>
    </section>
  );
}

export default MusicalGuestsSection;
