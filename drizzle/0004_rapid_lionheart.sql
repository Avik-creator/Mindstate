ALTER TABLE "agents" ADD COLUMN "category" text DEFAULT 'general' NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "runtimeName" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "runtimeVersion" text;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "detectionSignals" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "agents" ADD COLUMN "confidence" text DEFAULT 'low' NOT NULL;--> statement-breakpoint
CREATE INDEX "agents_category_idx" ON "agents" USING btree ("userId","category");--> statement-breakpoint
CREATE INDEX "handoffs_status_idx" ON "handoffs" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "handoffs_project_idx" ON "handoffs" USING btree ("userId","projectId");