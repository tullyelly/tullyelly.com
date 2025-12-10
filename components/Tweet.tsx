"use client";

import { Tweet } from "react-tweet";

type XEmbedProps = {
  id: string;
};

export function XEmbed({ id }: XEmbedProps) {
  return <Tweet id={id} />;
}
