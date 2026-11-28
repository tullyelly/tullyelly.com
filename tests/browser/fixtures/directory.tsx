import LcsLandingPage from "@/components/lcs/LcsLandingPage";
import UspsLandingPage from "@/components/usps/UspsLandingPage";
import BricksLandingPage from "@/components/bricks/BricksLandingPage";
import ReviewLandingPage from "@/components/reviews/ReviewLandingPage";
import CollectionDetailPage from "@/components/layout/CollectionDetailPage";
import { getLcsRouteConfig } from "@/lib/lcs-route-config";
import { getUspsRouteConfig } from "@/lib/usps-route-config";
import { getBricksRouteConfig } from "@/lib/bricks-route-config";
import { getReviewRouteConfig } from "@/lib/review-route-config";
import CategoryOverview from "@/components/categories/CategoryOverview";
import CategoryHistoryChart from "@/components/categories/CategoryHistoryChart";
import SetCollectorLandingPage from "@/components/set-collector/SetCollectorLandingPage";
import SetCollectorDetailPage from "@/components/set-collector/SetCollectorDetailPage";
import { tcdbTradePageThemeVars } from "@/lib/tcdb-theme";
import CratesDirectory from "@/components/theabbott/CratesDirectory";
import ContextDirectoryReturn from "@/components/directory/ContextDirectoryReturn";
import IdentityDirectoryClient from "@/components/identity/IdentityDirectoryClient";
import DirectoryReturnLink from "@/components/directory/DirectoryReturnLink";
import { TagMetadataProvider } from "@/components/tags/TagLink";
import VolleyballTournamentList from "@/components/unclejimmy/VolleyballTournamentList";
import React from "react";
import TCDBRankingTableClient from "@/components/tcdb/TCDBRankingTableClient";
import type { TCDBRankingTableRow } from "@/components/tcdb/TCDBRankingTable";
import HomieDirectory from "@/app/cardattack/homies/_components/HomieDirectory";
import RankingDetailPage from "@/components/tcdb/RankingDetailPage";
import type { HomieDirectoryRow } from "@/lib/data/homies";
import { createRoot } from "react-dom/client";
import "@/app/globals.css";
import { useDirectoryField } from "@/components/directory/useDirectoryField";
import PageIntro from "@/components/layout/PageIntro";
import PageSections from "@/components/layout/PageSections";
import DataToolbar, { DataResultCount } from "@/components/ui/DataToolbar";
import TableSearch from "@/components/ui/TableSearch";
import TablePager from "@/components/ui/TablePager";
import { PageState } from "@/components/ui/PageState";
import { clampDirectoryPage } from "@/lib/directory-state";

function Fixture() {
  const [q, setQ] = useDirectoryField<string>("q", "");
  const [sort, setSort] = useDirectoryField<string>("sort", "name", [
    "name",
    "reverse",
  ]);
  const [page, setPage] = useDirectoryField<number>("page", 1);
  const [size, setSize] = useDirectoryField<number>("pageSize", 25, [25, 50]);
  const rows = Array.from(
    { length: 60 },
    (_, i) => `Homie ${String(i + 1).padStart(2, "0")}`,
  ).filter((name) => name.toLowerCase().includes(q.toLowerCase()));
  if (sort === "reverse") rows.reverse();
  const current = clampDirectoryPage(page, rows.length, size);
  return (
    <main className="mx-auto max-w-[72rem] space-y-6 p-4">
      <PageIntro
        title="Directory fixture with a long title that must wrap"
        eyebrow="cardattack"
        description="Isolated public browse state."
        showProductionLink={false}
      />
      <DataToolbar
        search={
          <TableSearch
            label="Search homies"
            query={q}
            onQueryChange={setQ}
            ariaControls="results"
          />
        }
        filters={
          <label>
            Sort
            <select
              aria-label="Sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="reverse">Reverse</option>
            </select>
          </label>
        }
        result={<DataResultCount>{rows.length} results</DataResultCount>}
      />
      <ul id="results">
        {rows.slice((current - 1) * size, current * size).map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      {rows.length === 0 ? (
        <PageState
          compact
          title="No matches"
          description="Try another search."
          actions={<button onClick={() => setQ("")}>Reset search</button>}
        />
      ) : null}
      <TablePager
        page={current}
        pageSize={size}
        total={rows.length}
        onPageChange={setPage}
        onPageSizeChange={setSize}
        pageSizeOptions={[25, 50]}
      />
      <PageSections
        sections={[
          {
            id: "relationships",
            title: "Relationships",
            content: <p>No relationships recorded yet.</p>,
          },
          {
            id: "history",
            title: "History",
            content: <p>Zero cards is a recorded count.</p>,
          },
        ]}
      />
      <PageState compact role="status" title="Loading history" />
      <PageState
        compact
        title="History unavailable"
        description="The source could not be loaded."
      />
      <PageState
        compact
        role="alert"
        title="Could not load details"
        description="Try again later."
      />
    </main>
  );
}
const homies: HomieDirectoryRow[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name:
    i === 0
      ? "Giannis Antetokounmpo with a very long display name"
      : `Homie ${i + 1}`,
  tag_slug: `homie-${i + 1}`,
  route_slug: `homie-${i + 1}`,
  searchTerms: i === 0 ? ["greek-freak"] : [],
  drafted: 2013,
  updated_at: null,
  card_count: i === 1 ? null : 30 - i,
  ranking: i === 1 ? null : i + 1,
  ranking_at: i === 1 ? null : "2026-11-28",
  difference: null,
  rank_delta: null,
  diff_delta: null,
  trend_rank: null,
  trend_overall: i === 0 ? "up" : null,
  diff_sign_changed: null,
}));
function HomieFixture() {
  return (
    <main className="mx-auto max-w-[72rem] p-4">
      {location.pathname.startsWith("/cardattack/homies/") ? (
        <RankingDetailPage
          title={homies[0].name}
          eyebrow="Jersey 1"
          fields={[
            { label: "Cards", value: 30 },
            { label: "Measured", value: "November 28, 2026" },
          ]}
        >
          <p>Fixture history and relationships</p>
        </RankingDetailPage>
      ) : (
        <>
          <h1>Homies</h1>
          <HomieDirectory initialRows={homies} canUpdate={false} />
        </>
      )}
    </main>
  );
}

function ClanFixture() {
  const query = new URLSearchParams(location.search);
  const clanRows: TCDBRankingTableRow[] = ["Basketball", "Football"].map(
    (sport, i) => ({
      key: sport,
      name: "Milwaukee Bucks",
      href: "/cardattack/clans/milwaukee-bucks",
      identifierLabel: "Sport",
      identifierValue: sport,
      card_count: 120 - i * 20,
      ranking: i + 1,
      ranking_at: "2026-11-28",
      difference: 1,
      rank_delta: 1,
      diff_delta: 1,
      trend_rank: "up",
      trend_overall: "up",
      diff_sign_changed: false,
    }),
  );
  const rows = clanRows.filter(
    (row) =>
      !query.get("sport") ||
      row.identifierValue.toLowerCase() === query.get("sport"),
  );
  return (
    <main className="mx-auto max-w-[72rem] p-4">
      {location.pathname.endsWith("milwaukee-bucks") ? (
        <RankingDetailPage
          title="Milwaukee Bucks"
          eyebrow="Clan"
          topHref="/cardattack/clans"
          topLabel="Back to clans"
          fieldGroups={clanRows.map((row) => ({
            title: row.identifierValue,
            fields: [
              { label: "Cards", value: row.card_count },
              { label: "Measured", value: "Nov 28, 2026" },
            ],
            content: <p>No snapshot history recorded yet.</p>,
          }))}
        >
          <h2>Members</h2>
          <p>No memberships recorded yet.</p>
        </RankingDetailPage>
      ) : (
        <>
          <h1>Clans</h1>
          <TCDBRankingTableClient
            allowSort
            sportOptions={[
              { value: "basketball", label: "Basketball" },
              { value: "football", label: "Football" },
            ]}
            labels={{
              searchPlaceholder: "Search clans",
              searchAriaLabel: "Search clans",
              identifierColumn: "Sport",
              emptyMessage: "No matching clans",
              emptyDatasetMessage: "No clans yet",
              tableAriaLabel: "Clans",
            }}
            serverData={{
              data: rows,
              meta: {
                page: 1,
                pageSize: 25,
                total: rows.length,
                totalPages: 1,
              },
            }}
          />
        </>
      )}
    </main>
  );
}
function FamilyFixture() {
  const directory = "/unclejimmy/fam";
  const rows = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    slug: `fam-${i + 1}`,
    displayName:
      i === 0
        ? "Bonnibel with a very long family display name"
        : `Fam ${String(i + 1).padStart(2, "0")}`,
    aliases: i === 0 ? ["bonnie"] : [],
  }));
  const metadata = Object.fromEntries(
    rows.map((row) => [
      row.slug,
      {
        href: `${directory}/${row.slug}`,
        hrefKind: "custom",
        isClickable: true,
      },
    ]),
  );
  return (
    <main className="mx-auto max-w-[72rem] space-y-6 p-4">
      <TagMetadataProvider metadata={metadata}>
        {location.pathname === directory ? (
          <>
            <PageIntro title="Fam" eyebrow="unclejimmy" />
            <IdentityDirectoryClient
              identities={rows}
              directoryHref={directory}
              title="Fam"
              emptyLabel="No family recorded yet"
            />
          </>
        ) : (
          <>
            <PageIntro
              title={rows[0].displayName}
              eyebrow="unclejimmy · Fam"
              actions={
                <DirectoryReturnLink directory={directory} className="btn">
                  Back to Fam
                </DirectoryReturnLink>
              }
            />
            <PageSections
              sections={[
                {
                  id: "story",
                  title: "Personal story",
                  content: (
                    <>
                      <p>A preserved family story.</p>
                      <iframe
                        title="Family document fixture"
                        srcDoc="<p>Document preview</p>"
                        className="h-[640px] w-full"
                      />
                    </>
                  ),
                },
                {
                  id: "chronicles",
                  title: "Chronicles",
                  content: <p>No chronicles recorded yet.</p>,
                },
              ]}
            />
          </>
        )}
      </TagMetadataProvider>
    </main>
  );
}
function VolleyballFixture() {
  const directory = "/unclejimmy/squad/volleyball";
  return (
    <main className="mx-auto max-w-[72rem] space-y-6 p-4">
      <PageIntro title="Volleyball Tournaments" eyebrow="unclejimmy" />
      {location.pathname === directory ? (
        <VolleyballTournamentList
          rows={Array.from({ length: 30 }, (_, i) => ({
            tournamentId: String(i + 1),
            tournamentName: `Tournament ${String(i + 1).padStart(2, "0")}`,
            finish: i === 0 ? null : 1,
            overallWins: 3,
            overallLosses: 1,
            overallRecord: "3-1",
            tournamentDays: 2,
            latestTournamentDate: "2026-11-28",
          }))}
        />
      ) : (
        <DirectoryReturnLink directory={directory} className="btn">
          Back to tournaments
        </DirectoryReturnLink>
      )}
    </main>
  );
}
function MusicFixture() {
  const rows = Array.from({ length: 30 }, (_, i) => ({
    type: i % 2 === 0 ? ("video" as const) : ("playlist" as const),
    id: String(i + 1),
    song: i === 0 ? undefined : `Music ${i + 1}`,
    artistTag: i === 0 ? "unclassified-artist" : "aesop-rock",
    chronicleTitle: `Source Chronicle ${i + 1}`,
    chronicleUrl: `/shaolin/music-${i + 1}`,
    chronicleDate: "2026-11-28",
  }));
  return (
    <main className="mx-auto max-w-[72rem] space-y-6 p-4">
      <PageIntro title="The Crates" eyebrow="theabbott" />
      {location.pathname === "/theabbott/crates" ? (
        <TagMetadataProvider
          metadata={{
            "unclassified-artist": {
              href: "/shaolin/tags/unclassified-artist",
              hrefKind: "tag",
              isClickable: true,
            },
          }}
        >
          <CratesDirectory
            appearances={rows}
            artistNames={{
              "unclassified-artist":
                "An unclassified artist with a long display name",
              "aesop-rock": "Aesop Rock",
            }}
          />
        </TagMetadataProvider>
      ) : (
        <>
          <ContextDirectoryReturn
            directory="/theabbott/crates"
            label="Back to Crates"
          />
          <p>Original Chronicle and music destination fixture.</p>
        </>
      )}
    </main>
  );
}

function CategoryFixture() {
  const rows = Array.from({ length: 30 }, (_, i) => ({
    category_id: String(i + 1),
    slug: `category-${i + 1}`,
    name: `Category ${String(i + 1).padStart(2, "0")}`,
    snapshot_id: i === 1 ? null : String(i + 1),
    measured_on: i === 1 ? null : "2026-11-28",
    card_count: i === 1 ? null : i * 10,
    previous_date: null,
    previous_count: null,
    count_change: null,
    ranking: null,
    previous_ranking: null,
    rank_delta: null,
    trend_rank: null,
    difference: null,
    previous_difference: null,
    diff_delta: null,
    trend_overall: null,
    diff_sign_changed: null,
  }));
  return (
    <main
      className="mx-auto max-w-[72rem] space-y-6 p-4"
      style={tcdbTradePageThemeVars}
    >
      <PageIntro title="Categories" eyebrow="cardattack" />
      {location.pathname === "/cardattack/categories" ? (
        <CategoryOverview categories={rows} />
      ) : (
        <>
          <DirectoryReturnLink
            directory="/cardattack/categories"
            className="btn"
          >
            Back to categories
          </DirectoryReturnLink>
          <h2>Count history</h2>
          <CategoryHistoryChart
            snapshots={[
              {
                ...rows[0],
                snapshot_id: "1",
                measured_on: "2026-11-28",
                card_count: 0,
              },
            ]}
          />
          <p>Nov 28, 2026: 0 cards</p>
        </>
      )}
    </main>
  );
}
function SetsFixture() {
  const rows = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    setSlug: `set-${i + 1}`,
    setName: `Set ${String(i + 1).padStart(2, "0")}`,
    releaseYear: 2026,
    manufacturer: "Upper Deck",
    tcdbSetUrl: "https://www.tcdb.com/",
    totalCards: 100,
    snapshotCount: i === 1 ? 0 : 1,
    cardsOwned: i === 1 ? undefined : i === 2 ? 100 : 0,
    cardsMissing: i === 1 ? undefined : i === 2 ? 0 : 100,
    percentComplete: i === 1 ? undefined : i === 2 ? 100 : 0,
    latestSnapshotDate: i === 1 ? undefined : "2026-11-28",
    categoryTag: i % 2 ? "basketball" : "non-sport",
  }));
  return (
    <main className="mx-auto max-w-[72rem] p-4">
      {location.pathname === "/cardattack/set-collector" ? (
        <SetCollectorLandingPage rows={rows} />
      ) : (
        <SetCollectorDetailPage
          setCollector={{
            ...rows[0],
            snapshots: [
              {
                id: 1,
                setId: 1,
                snapshotDate: "2026-11-28",
                cardsOwned: 0,
                totalCards: 100,
                cardsMissing: 100,
                percentComplete: 0,
              },
            ],
          }}
        />
      )}
    </main>
  );
}

const trackerPaths = [
  "/cardattack/lcs",
  "/cardattack/usps",
  "/unclejimmy/bricks",
  "/unclejimmy/call-a-save-point",
  "/unclejimmy/golden-age",
  "/unclejimmy/table-schema",
];
function TrackerFixture() {
  const base = trackerPaths.find((path) => location.pathname.startsWith(path))!;
  const reviewType = base.endsWith("call-a-save-point")
    ? "save-point"
    : base.endsWith("golden-age")
      ? "golden-age"
      : "table-schema";
  const config = base.endsWith("lcs")
    ? getLcsRouteConfig()
    : base.endsWith("usps")
      ? getUspsRouteConfig()
      : base.endsWith("bricks")
        ? getBricksRouteConfig("lego")
        : getReviewRouteConfig(reviewType);
  const rows = Array.from({ length: 30 }, (_, i) => ({
    slug: `fixture-${i + 1}`,
    name: `Fixture ${String(i + 1).padStart(2, "0")}`,
    rating: 9,
    visitCount: i,
    latestVisitDate: i === 1 ? undefined : "2026-11-28",
    state: i % 2 ? "WI" : "IL",
  }));
  const prefix = base.endsWith("lcs")
    ? "lcs"
    : base.endsWith("usps")
      ? "usps"
      : base.endsWith("bricks")
        ? "bricks"
        : "review";
  return (
    <main className="mx-auto max-w-[72rem] p-4">
      {location.pathname !== base ? (
        <CollectionDetailPage
          backHref={base}
          backLabel="Back to directory"
          eyebrow={config.detailHeroEyebrow}
          title="Fixture 01"
          stats={[{ label: "Recorded activity", value: 0 }]}
          sectionId="fixture-feed"
          sectionTitle="Chronicle Feed"
          pageThemeStyle={config.pageThemeVars}
          theme={{
            accent: `var(--${prefix}-accent)`,
            accentDeep: `var(--${prefix}-accent-deep)`,
            foreground: `var(--${prefix}-pill-fg)`,
            ink: `var(--${prefix}-ink)`,
            link: `var(--${prefix}-link)`,
            linkHover: `var(--${prefix}-link-hover)`,
            accentSoft: `var(--${prefix}-accent-soft)`,
          }}
        >
          <p>No activity recorded yet.</p>
        </CollectionDetailPage>
      ) : base.endsWith("lcs") ? (
        <LcsLandingPage config={getLcsRouteConfig()} rows={rows} />
      ) : base.endsWith("usps") ? (
        <UspsLandingPage
          config={getUspsRouteConfig()}
          rows={rows.map((row) => ({
            ...row,
            citySlug: row.slug,
            cityName: row.name,
          }))}
        />
      ) : base.endsWith("bricks") ? (
        <BricksLandingPage
          config={getBricksRouteConfig("lego")}
          rows={rows.map((row) => ({
            subset: "lego",
            publicId: row.slug,
            setName: row.name,
            reviewScore: row.rating,
            sessionCount: row.visitCount,
            latestBuildDate: row.latestVisitDate,
          }))}
        />
      ) : (
        <ReviewLandingPage
          config={getReviewRouteConfig(reviewType)}
          rows={rows.map((row) => ({
            reviewType,
            externalId: row.slug,
            name: row.name,
            averageRating: row.rating,
            visitCount: row.visitCount,
            latestPostDate: "2026-11-28",
          }))}
        />
      )}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  trackerPaths.some((path) => location.pathname.startsWith(path)) ? (
    <TrackerFixture />
  ) : location.pathname.startsWith("/cardattack/categories") ? (
    <CategoryFixture />
  ) : location.pathname.startsWith("/cardattack/set-collector") ? (
    <SetsFixture />
  ) : location.pathname.startsWith("/theabbott/crates") ||
    location.pathname.startsWith("/shaolin/") ? (
    <MusicFixture />
  ) : location.pathname.startsWith("/unclejimmy/fam") ? (
    <FamilyFixture />
  ) : location.pathname.startsWith("/unclejimmy/squad/volleyball") ? (
    <VolleyballFixture />
  ) : location.pathname.startsWith("/cardattack/clans") ? (
    <ClanFixture />
  ) : location.pathname.startsWith("/cardattack/homies") ? (
    <HomieFixture />
  ) : (
    <Fixture />
  ),
);
