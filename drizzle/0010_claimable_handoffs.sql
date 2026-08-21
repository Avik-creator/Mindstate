ALTER TABLE "handoffs" ADD COLUMN "claimedBySessionId" text;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "claimedByAgentId" text;--> statement-breakpoint
ALTER TABLE "handoffs" ADD COLUMN "claimedAt" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "handoffs_claim_idx" ON "handoffs" USING btree ("userId","claimedBySessionId");