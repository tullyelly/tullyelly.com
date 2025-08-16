export const runtime = 'nodejs';
import prisma from '@/lib/prisma';

export default async function Home() {
  let message;

  try {
    const msg = await prisma.message.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { text: true },
    });
    message = msg?.text ?? 'No message found';
  } catch (error) {
    console.error('Error fetching message:', error);
    message = 'No message found';
  }

  return (
    <main style={{ padding: 32 }}>
      <h1>{message}</h1>
    </main>
  );
}
