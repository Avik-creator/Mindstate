ALTER TABLE "agent_sessions" ADD COLUMN "agentId" text;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD COLUMN "lastHeartbeatAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "agent_sessions" ADD COLUMN "endedAt" timestamp;--> statement-breakpoint
CREATE INDEX "sessions_live_idx" ON "agent_sessions" USING btree ("userId","status","lastHeartbeatAt");--> statement-breakpoint
CREATE INDEX "sessions_agent_idx" ON "agent_sessions" USING btree ("userId","agentId");