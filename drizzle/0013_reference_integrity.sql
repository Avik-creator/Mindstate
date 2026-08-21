-- A project or session reference must resolve inside the same workspace. Until now nothing in the
-- database said so, so a row could name a project its owner could not see.

-- The foreign keys below target these columns, so the unique indexes have to exist first.
CREATE UNIQUE INDEX "projects_user_id_uidx" ON "projects" USING btree ("userId","id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_sessions_user_id_uidx" ON "agent_sessions" USING btree ("userId","id");--> statement-breakpoint

-- Clear references written before the guard existed. Set to null rather than deleted: the row is
-- the user's content and only its filing is wrong. A constraint cannot be added while these remain.
UPDATE "memories" SET "projectId" = NULL WHERE "projectId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."id" = "memories"."projectId" AND p."userId" = "memories"."userId");--> statement-breakpoint
UPDATE "memories" SET "sessionId" = NULL WHERE "sessionId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "agent_sessions" s WHERE s."id" = "memories"."sessionId" AND s."userId" = "memories"."userId");--> statement-breakpoint
UPDATE "agent_sessions" SET "projectId" = NULL WHERE "projectId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."id" = "agent_sessions"."projectId" AND p."userId" = "agent_sessions"."userId");--> statement-breakpoint
UPDATE "handoffs" SET "projectId" = NULL WHERE "projectId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "projects" p WHERE p."id" = "handoffs"."projectId" AND p."userId" = "handoffs"."userId");--> statement-breakpoint
UPDATE "handoffs" SET "sessionId" = NULL WHERE "sessionId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "agent_sessions" s WHERE s."id" = "handoffs"."sessionId" AND s."userId" = "handoffs"."userId");--> statement-breakpoint

-- MATCH SIMPLE, so a null projectId or sessionId stays unconstrained and "filed nowhere" remains legal.
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_project_fk" FOREIGN KEY ("userId","projectId") REFERENCES "public"."projects"("userId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_project_fk" FOREIGN KEY ("userId","projectId") REFERENCES "public"."projects"("userId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_session_fk" FOREIGN KEY ("userId","sessionId") REFERENCES "public"."agent_sessions"("userId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_project_fk" FOREIGN KEY ("userId","projectId") REFERENCES "public"."projects"("userId","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handoffs" ADD CONSTRAINT "handoffs_session_fk" FOREIGN KEY ("userId","sessionId") REFERENCES "public"."agent_sessions"("userId","id") ON DELETE no action ON UPDATE no action;
