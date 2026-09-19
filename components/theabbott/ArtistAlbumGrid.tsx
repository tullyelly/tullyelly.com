import { Badge } from "@/app/ui/Badge";
import { getBadgeClass } from "@/app/ui/badge-maps";
import { YearBadge } from "@/app/ui/YearBadge";
import { Card, CardGrid } from "@ui";

export type ArtistAlbum = {
  title: string;
  year: number;
  note: string;
};

type ArtistAlbumGridProps = {
  albums: ArtistAlbum[];
  classicTitle: string;
};

export default function ArtistAlbumGrid({
  albums,
  classicTitle,
}: ArtistAlbumGridProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Albums to Explore</h3>
      <CardGrid>
        {albums.map((album) => {
          const isClassic = album.title === classicTitle;

          return (
            <Card
              key={album.title}
              className={`relative ${isClassic ? "border-[4px] border-[var(--blue)]" : ""}`}
            >
              <YearBadge year={album.year} />
              <h4 className="pr-16 font-semibold italic">{album.title}</h4>
              <p className="mt-2 text-sm text-fg/80 leading-relaxed">
                {album.note}
              </p>
              {isClassic ? (
                <Badge
                  className={`${getBadgeClass("classic")} absolute bottom-2 right-2`}
                >
                  unclejimmy classic
                </Badge>
              ) : null}
            </Card>
          );
        })}
      </CardGrid>
    </div>
  );
}
