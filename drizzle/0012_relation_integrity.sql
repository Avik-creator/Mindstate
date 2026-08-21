-- Relations that outlived the memories they point at. The foreign keys below cannot be added
-- while these exist, and they are what surfaced as "Unknown memory" in a contradiction list.
DELETE FROM "memory_relations" r
WHERE NOT EXISTS (SELECT 1 FROM "memories" m WHERE m."id" = r."fromId")
   OR NOT EXISTS (SELECT 1 FROM "memories" m WHERE m."id" = r."toId");
--> statement-breakpoint
-- Contradiction is symmetric, but the unique index is on the ordered pair, so the same
-- disagreement could be stored twice, once from each side. Keep the earliest of each pair.
DELETE FROM "memory_relations" a
USING "memory_relations" b
WHERE a."kind" = 'contradicts' AND b."kind" = 'contradicts'
  AND a."userId" = b."userId"
  AND least(a."fromId", a."toId") = least(b."fromId", b."toId")
  AND greatest(a."fromId", a."toId") = greatest(b."fromId", b."toId")
  AND (a."createdAt", a."id") > (b."createdAt", b."id");
--> statement-breakpoint
-- Store every remaining contradiction under the canonical ordering, so the unique index now
-- actually enforces one row per pair.
UPDATE "memory_relations" SET "fromId" = "toId", "toId" = "fromId"
WHERE "kind" = 'contradicts' AND "fromId" > "toId";
--> statement-breakpoint
ALTER TABLE "memory_relations" ADD CONSTRAINT "memory_relations_fromId_memories_id_fk" FOREIGN KEY ("fromId") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_relations" ADD CONSTRAINT "memory_relations_toId_memories_id_fk" FOREIGN KEY ("toId") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;