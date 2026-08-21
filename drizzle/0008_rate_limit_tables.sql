CREATE TABLE "api_rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rateLimit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"lastRequest" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "api_rate_limits_expiry_idx" ON "api_rate_limits" USING btree ("expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "rateLimit_key_uidx" ON "rateLimit" USING btree ("key");