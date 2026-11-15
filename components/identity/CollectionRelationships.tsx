import { Suspense } from "react";
import { Card } from "@ui";
import CollectionRelationshipsView from "@/components/identity/CollectionRelationshipsView";
import {
  loadCollectionRelationshipData,
  type CollectionRelationshipMode,
} from "@/lib/collection-relationship-data";

type Props = {
  slug: string;
  displayName: string;
  mode: CollectionRelationshipMode;
};
async function RelationshipBody(props: Props) {
  const data = await loadCollectionRelationshipData(props.slug, props.mode);
  return <CollectionRelationshipsView {...props} data={data} />;
}
export default function CollectionRelationships(props: Props) {
  return (
    <Suspense
      fallback={
        <Card as="section">
          <p role="status">Loading collection relationships...</p>
        </Card>
      }
    >
      <RelationshipBody {...props} />
    </Suspense>
  );
}
