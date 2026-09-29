# Tag relationships view

`dojo.v_tag_relationships` presents every tag from the selected tag's
perspective. `dojo.tag_relation` is directed: `source member_of target` means
the source tag is the member and the target tag is the containing group.

## Columns

| Column                                                           | Meaning                                                                                                                                                   |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tag_id`, `tag_slug`, `tag_display_name`                         | The selected tag. Filter these columns to choose the tag whose relationships are shown.                                                                   |
| `related_tag_id`, `related_tag_slug`, `related_tag_display_name` | The tag reached from the selected tag. These values are null only for an isolated tag.                                                                    |
| `relationship_scope`                                             | `direct` for a stored edge, `indirect` for a `member_of` path with two or more edges, or null for an isolated tag.                                        |
| `relationship_direction`                                         | `outgoing` follows source to target. `incoming` follows target to source. For `member_of`, outgoing rows are ancestors and incoming rows are descendants. |
| `relation_type`                                                  | The stored direct relationship type, or `member_of` for an indirect membership path.                                                                      |
| `depth`                                                          | Number of edges traversed. Direct connections have depth 1.                                                                                               |
| `path_tag_ids`, `path_tag_slugs`                                 | Ordered tags from the selected tag through the related tag, including both endpoints. Each distinct membership path has its own row.                      |
| `direct_relation_id`                                             | Original `dojo.tag_relation.id` for a direct row. It is null for indirect and isolated rows.                                                              |
| `direct_source_tag_id`, `direct_target_tag_id`                   | Original stored edge endpoints for a direct row. They are null for indirect and isolated rows.                                                            |
| `direct_relation_meta`                                           | Original stored relationship metadata for a direct row. It is null for an indirect path because a path has no single relationship metadata value.         |

The view follows `member_of` chains in one direction at a time. It does not
switch direction to find siblings. A tag cannot repeat within one traversal
path, which makes cycles finite while preserving multiple distinct paths. No
depth limit is imposed.

## Example queries

All relationships for an exact tag slug:

```sql
SELECT *
FROM dojo.v_tag_relationships
WHERE tag_slug = 'your-tag-slug'
ORDER BY relationship_scope, relationship_direction, relation_type, depth,
         path_tag_slugs;
```

Direct relationships only:

```sql
SELECT *
FROM dojo.v_tag_relationships
WHERE tag_slug = 'your-tag-slug'
  AND relationship_scope = 'direct'
ORDER BY relationship_direction, relation_type, related_tag_slug;
```

Membership ancestors, including direct parents at depth 1:

```sql
SELECT *
FROM dojo.v_tag_relationships
WHERE tag_slug = 'your-tag-slug'
  AND relation_type = 'member_of'
  AND relationship_direction = 'outgoing'
ORDER BY depth, path_tag_slugs;
```

Membership descendants, including direct members at depth 1:

```sql
SELECT *
FROM dojo.v_tag_relationships
WHERE tag_slug = 'your-tag-slug'
  AND relation_type = 'member_of'
  AND relationship_direction = 'incoming'
ORDER BY depth, path_tag_slugs;
```

Find a tag by partial display name or slug, then use its `tag_slug` in the
queries above:

```sql
SELECT DISTINCT tag_id, tag_slug, tag_display_name
FROM dojo.v_tag_relationships
WHERE tag_display_name ILIKE '%' || 'search text' || '%'
   OR tag_slug ILIKE '%' || 'search-text' || '%'
ORDER BY tag_display_name, tag_slug;
```

## Cost characteristics

This is a regular read-only view. Its recursive portion enumerates every
distinct simple `member_of` path needed by the query. The existing source and
target indexes on `dojo.tag_relation` support each traversal step, but graphs
with many branches and cross-links can produce many paths. This is intentional
because the view does not silently truncate results. Filter by exact `tag_id`
or `tag_slug` whenever possible and inspect `EXPLAIN (ANALYZE, BUFFERS)` against
representative non-production data if the membership graph becomes large.
