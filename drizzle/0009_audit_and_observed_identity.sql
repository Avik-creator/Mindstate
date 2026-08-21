CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"actorType" text NOT NULL,
	"actorId" text,
	"credentialId" text,
	"action" text NOT NULL,
	"targetType" text NOT NULL,
	"targetId" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "observedUserAgent" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "observedSurfaces" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "observedRequests" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "audit_user_created_idx" ON "audit_events" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_events" USING btree ("userId","targetType","targetId");