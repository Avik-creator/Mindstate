CREATE TABLE "agent_signup_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"agentName" text NOT NULL,
	"tokenHash" text NOT NULL,
	"scopes" jsonb NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_signup_tokens_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"lastSeenAt" timestamp,
	"revokedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "agentId" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "scopes" jsonb DEFAULT '["memory:read"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "actorType" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "memories" ADD COLUMN "actorId" text;--> statement-breakpoint
CREATE INDEX "agent_signup_tokens_user_idx" ON "agent_signup_tokens" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "agents_user_idx" ON "agents" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "api_keys_agent_idx" ON "api_keys" USING btree ("userId","agentId");