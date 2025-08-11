# API Backend Structure

This directory contains the Express.js API backend following DDD (Domain Driven Design) architecture.

## Structure

- `domain/` - Domain layer (entities, aggregates, domain services)
- `infrastructure/` - Infrastructure layer (persistence, external services)
- `application/` - Application layer (use cases, application services)
- `interfaces/` - Interface layer (controllers, routes, middleware)

## Legacy

The existing structure under `modules/` contains the legacy code that will be gradually migrated to the new DDD structure.
