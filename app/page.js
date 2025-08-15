import prisma from '@/lib/prisma';

export default async function Home() {
  const msg = await prisma.message.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { text: true },
  });

  return (
    <main style={{ padding: 32 }}>
      <h1>{msg?.text ?? 'No message found'}</h1>
    </main>
  );
}
