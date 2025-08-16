import Image from 'next/image';

export default function HugBallPage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>We made it to Vercel!</h1>
      <p>I love you all. Hug ball.</p>
      <Image
        src="https://placehold.co/600x400?text=Hug+Ball"
        alt="Fellas hugging"
        width={600}
        height={400}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </main>
  );
}
