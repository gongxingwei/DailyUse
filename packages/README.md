# DailyUse Packages

This directory contains shared packages for the monorepo:

- @dailyuse/utils: Framework-agnostic utilities (time, id, errors, axios base, etc.)
- @dailyuse/domain: Domain entities, value objects, application services, ports
- @dailyuse/contracts: DTOs, zod schemas, shared API contracts
- @dailyuse/ui: Reusable Vue components and theme (peer deps: vue, vuetify)

Build order suggestion: utils -> contracts -> domain -> ui.
