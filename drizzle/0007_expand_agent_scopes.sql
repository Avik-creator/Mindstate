-- Widening the scope vocabulary would otherwise silently strip access from credentials issued under the original four.
-- Each existing credential gains exactly the scopes its old grant implied, so behaviour is unchanged.
UPDATE "api_keys" SET "scopes" = (
  SELECT COALESCE(jsonb_agg(DISTINCT scope), '[]'::jsonb)
  FROM unnest(
    ARRAY(SELECT jsonb_array_elements_text("api_keys"."scopes"))
    || CASE WHEN jsonb_exists("api_keys"."scopes", 'memory:read') THEN ARRAY['project:read', 'handoff:read'] ELSE ARRAY[]::text[] END
    || CASE WHEN jsonb_exists("api_keys"."scopes", 'memory:write') THEN ARRAY['project:write', 'handoff:write', 'agent:write'] ELSE ARRAY[]::text[] END
  ) AS scope
)
WHERE jsonb_exists("api_keys"."scopes", 'memory:read') OR jsonb_exists("api_keys"."scopes", 'memory:write');
--> statement-breakpoint
UPDATE "agent_signup_tokens" SET "scopes" = (
  SELECT COALESCE(jsonb_agg(DISTINCT scope), '[]'::jsonb)
  FROM unnest(
    ARRAY(SELECT jsonb_array_elements_text("agent_signup_tokens"."scopes"))
    || CASE WHEN jsonb_exists("agent_signup_tokens"."scopes", 'memory:read') THEN ARRAY['project:read', 'handoff:read'] ELSE ARRAY[]::text[] END
    || CASE WHEN jsonb_exists("agent_signup_tokens"."scopes", 'memory:write') THEN ARRAY['project:write', 'handoff:write', 'agent:write'] ELSE ARRAY[]::text[] END
  ) AS scope
)
WHERE "usedAt" IS NULL AND (jsonb_exists("agent_signup_tokens"."scopes", 'memory:read') OR jsonb_exists("agent_signup_tokens"."scopes", 'memory:write'));
