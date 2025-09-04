import Link from 'next/link';
import FlowersInline from '@/components/flowers/FlowersInline';

type Props = { date?: string };

export function MusicalGuestsSection({ date }: Props) {
  return (
    <section aria-label="Musical Guests" className="space-y-2">
      <h2 className="text-xl md:text-2xl font-semibold leading-snug">
        <span aria-hidden>🎤</span>Musical Guests{date ? `; ${date}` : ''}
      </h2>
      <p className="text-sm md:text-[15px] text-muted-foreground">{/* opening blurb */}</p>
      <ul className="list-disc list-inside text-sm md:text-[15px] space-y-1">
        <li>
          <Link href="/heels-have-eyes" className="underline hover:no-underline">
            Heels Have Eyes
          </Link>
        </li>
        <li>
          <Link href="/roadwork-rappin" className="underline hover:no-underline">
            Roadwork Rappin
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
          {" & "}
          <a
            href="https://www.instagram.com/aesoprockwins/?hl=en"
            className="underline hover:no-underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            aesop rock
          </a>
        </FlowersInline>
      </p>
    </section>
  );
}

export default MusicalGuestsSection;
