CREATE TABLE "memory_relations" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"fromId" text NOT NULL,
	"toId" text NOT NULL,
	"kind" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"actorType" text DEFAULT 'user' NOT NULL,
	"actorId" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "memory_relations_edge_uidx" ON "memory_relations" USING btree ("userId","fromId","toId","kind");--> statement-breakpoint
CREATE INDEX "memory_relations_from_idx" ON "memory_relations" USING btree ("userId","fromId");--> statement-breakpoint
CREATE INDEX "memory_relations_to_idx" ON "memory_relations" USING btree ("userId","toId");