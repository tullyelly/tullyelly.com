import { type ReactNode } from "react";

import { ScrollCallout } from "@/components/scrolls/ScrollCallout";

interface CipherSaysProps {
  children: ReactNode;
  className?: string;
}

const cipherSaysBodyClassName =
  "bg-[var(--ink)] text-[color:var(--tc-chrome-hi)] [&_a]:!text-[color:var(--tc-chrome-hi)] [&_a:hover]:bg-[var(--tc-chrome-silver)] [&_a:hover]:!text-[color:var(--ink)] [&_a:focus-visible]:outline-[var(--tc-chrome-silver)] [&_[data-person-tag]]:!text-[color:var(--tc-chrome-hi)] [&_ul>li]:marker:text-[color:var(--tc-chrome-hi)]";

const cipherSaysLabelClassName = "text-[color:var(--ink)]";

const cipherSaysLabelStyle = {
  backgroundColor: "var(--tc-chrome-silver)",
};

export function CipherSays({ children, className }: CipherSaysProps) {
  return (
    <ScrollCallout
      data-cipher-says
      label="cipher says"
      bodyClassName={cipherSaysBodyClassName}
      labelClassName={cipherSaysLabelClassName}
      labelStyle={cipherSaysLabelStyle}
      className={className}
    >
      {children}
    </ScrollCallout>
  );
}
