CREATE TABLE "workspace_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"agentName" text,
	"agentContext" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tokenHash" text NOT NULL,
	"requesterHash" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"claimStartedAt" timestamp,
	"claimedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_claims_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_claims_email_uidx" ON "workspace_claims" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workspace_claims_requester_idx" ON "workspace_claims" USING btree ("requesterHash","createdAt");--> statement-breakpoint
CREATE INDEX "workspace_claims_expiry_idx" ON "workspace_claims" USING btree ("expiresAt");