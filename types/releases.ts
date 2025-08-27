export interface ReleaseListItem {
  id: number;
  release_name: string;
  status: string;
  release_type: string;
  created_at: string;
  semver: string | null;
}

export interface PageMeta {
  limit: number;
  offset: number;
  total: number;
  sort: string;
  q?: string;
  status?: string[];
  type?: string[];
}

export interface ReleaseListResponse {
  items: ReleaseListItem[];
  page: PageMeta;
}
