export interface ReleaseRow {
  id: string;
  name: string;
  status: 'released' | 'planned' | 'archived';
  type: 'hotfix' | 'minor' | 'major' | 'planned';
  semver: string;
  sem_major: number;
  sem_minor: number;
  sem_patch: number;
  sem_hotfix?: number;
}

export interface PageMeta {
  limit: number;
  offset: number;
  total: number;
  sort: string;
  q?: string;
}

export interface ReleaseListResponse {
  items: ReleaseRow[];
  page: PageMeta;
}
