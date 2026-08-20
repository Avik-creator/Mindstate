// Infrastructure boundary placeholder.
//
// Once a database is connected, place provider-specific clients, schema, and
// repository implementations below this directory. Domain and application
// modules must never import Neon, Postgres, or Drizzle directly.
//
// Expected first adapter:
//   postgres/client.ts
//   postgres/schema.ts
//   postgres/memory-repository.ts
//   postgres/memory-search-repository.ts
//
// A future database swap only replaces these adapters and composition root.
export {}
