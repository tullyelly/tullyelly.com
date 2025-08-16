import Image from "next/image";

export const metadata = {
  title: "Hug Ball — tullyelly.com",
  description: "Fellas, we launched.",
};

export default function HugBallPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <Image src="/hug-ball-test.jpg" alt="Hug Ball" width={720} height={1280} />
      <p>Fellas, we launched.</p>
    </div>
  );
}
