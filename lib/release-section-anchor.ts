export const getReleaseSectionAnchorId = (sectionOrdinal: number): string =>
  `release-section-${sectionOrdinal}`;

export const getReleaseSectionHref = (
  postUrl: string,
  sectionOrdinal: number,
): string => `${postUrl}#${getReleaseSectionAnchorId(sectionOrdinal)}`;
