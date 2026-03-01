export type PersonTagProps = {
  displayName: string;
  tag: string;
};

/**
 * Highlights a person or concept in MDX and implicitly tags the chronicle.
 */
export default function PersonTag({ displayName, tag }: PersonTagProps) {
  return <i data-person-tag={tag}>{displayName}</i>;
}
