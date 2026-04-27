# Lithdex

Lithdex is a guided mineral and gemstone identification platform built around an analysis session, not just a one-off AI answer. Users upload specimen images, work through a structured identification flow, keep a history of their own analyses, and optionally publish completed or inconclusive analyses to a public community library for comments and confirm/dispute feedback.

The current product is aimed at collectors, hobbyists, and anyone who wants a more traceable identification workflow. The guided session matters because the system can ask for clarification or more images before reaching a conclusion, instead of treating identification as a single prompt-response exchange.

## Key Features

- Email/password authentication for account access.
- Signed-in dashboard with the user's own analyses and visibility state.
- New analysis flow with image upload and initial public/private selection.
- Owner-only guided analysis session for running and continuing an identification.
- Follow-up flow when the system needs clarification answers or additional images.
- Owner result dispute flow that records structured owner context and re-runs the guided analysis.
- Persisted analysis detail pages with result, history, images, and owner metadata.
- Public/private visibility management for completed and inconclusive analyses, including publish and unpublish behavior.
- Public analyses feed that acts as the community library.
- Community comments on public analyses, including edit/delete for the comment author.
- Confirm/dispute feedback on public analyses.
- Authenticated profile settings for public bio and avatar.
- Private media handling for analysis images and user avatars through app-controlled routes.

## Architecture

Lithdex follows a layered structure and keeps route handlers thin.

- `app`
  Next.js App Router entrypoints: pages, layouts, and API route handlers. These files read request context, require authentication where needed, and delegate work to application use cases.
- `presentation`
  Screens, components, hooks, and view behavior. This layer handles rendering, local UI state, request state, and client interactions.
- `application`
  Use cases, DTOs, configuration, and orchestration. This is where business workflows live, including analysis execution, visibility changes, comment mutation rules, profile updates, and media access decisions.
- `domain`
  Core concepts such as entities, enums, repository contracts, and shared rules. Examples include analysis status/visibility semantics and repository interfaces.
- `infrastructure`
  Technical implementations for Prisma, authentication, storage, HTTP response helpers, and AI integration.

In practice:

- Route handlers stay thin.
- Presentation handles screens and UI behavior only.
- Application owns orchestration and business validation.
- Domain defines the concepts and contracts.
- Infrastructure implements persistence and external services.

## Analysis Workflow

The current analysis lifecycle is centered on an owner-controlled session:

1. A signed-in user creates an analysis by uploading specimen images.
2. The analysis is created with an initial visibility choice and the user is redirected into the analysis session.
3. The session runs a guided AI pass over the uploaded images.
4. If the system needs more information, it can move the analysis into a follow-up state and request:
   clarification answers, additional images, or both.
5. The owner continues the same session until the analysis reaches a terminal outcome.
6. If the owner believes a completed or inconclusive result is wrong, they can submit a structured dispute with a proposed identification and evidence. That dispute is stored in the guided interaction history and triggers another server-side analysis pass through the same AI pipeline.

The current status model in the codebase is:

- `processing`
- `needs_input`
- `completed`
- `inconclusive`
- `failed`

The guided session remains owner-only even when an analysis is public. `failed` represents a failed analysis run, while `inconclusive` represents a terminal AI outcome where the system could not identify the specimen from the available material.

## Visibility And Publication Semantics

Analyses can be private or public, but the public library has stricter semantics than visibility alone.

An analysis is treated as published for the library when all of the following are true:

- `visibility = public`
- `status = completed` or `status = inconclusive`
- `publishedAt != null`

Current behavior:

- Owners can publish a completed or inconclusive private analysis.
- Publishing sets visibility to public and populates `publishedAt` when needed.
- Owners can make a public analysis private again.
- Unpublishing sets visibility back to private and clears `publishedAt`.
- Analyses that are not completed or inconclusive cannot be published to the public library.

This keeps the public library aligned with intentionally published terminal analyses that are useful for community discussion.

## Community Model

Community behavior is centered on public analyses.

- Public analyses can receive comments.
- Comment authors can edit and delete their own comments.
- Public analyses can receive confirm/dispute feedback from signed-in users.
- Community-facing comment and feedback mutation rules are enforced server-side through application use cases.

Lithdex does not currently document moderation, admin publishing, nested comment threads, or follow mechanics as implemented product areas.

## Profile And Identity

Authentication uses email and password, but public identity is based on nickname.

- Email is private.
- Nickname is the public-facing identity shown across the product.
- Signed-in users can manage a public bio and avatar in profile settings.
- The current repo does not expose public profile pages as a separate feature area.

## Media Handling And Privacy

Analysis images and user avatars are stored privately and served through app-controlled routes.

- Analysis images are accessed through internal media routes.
- User avatars are accessed through a dedicated avatar route.
- The storage bucket is not documented as public bucket infrastructure.
- Raw bucket URLs are not the primary media model exposed by the app.

This keeps media delivery aligned with private storage and server-controlled access.

## Technology Stack

The current repository shows the following core stack:

- Next.js App Router
- TypeScript
- React
- Prisma
- PostgreSQL
- Tailwind CSS with a shadcn/ui-style component layer under `presentation/ui`
- NVIDIA multimodal analysis integration
- Google Cloud Storage for private media objects

## Repository Structure

```text
app/             Next.js routes, pages, and API handlers
presentation/    Screens, UI components, hooks, layouts
application/     Use cases, DTOs, app-level config
domain/          Entities, enums, rules, repository contracts
infrastructure/  Prisma, auth, storage, AI, HTTP utilities
prisma/          Prisma schema and migrations/config inputs
public/          Static assets
```

Other notable files:

- `.env.example` documents the current environment variables used by the app.
- `prisma.config.ts` holds Prisma datasource configuration for the current setup.

## Setup And Configuration

Lithdex requires:

- Node.js
- PostgreSQL
- Prisma
- Google Cloud Storage configuration for private media
- NVIDIA API configuration for the analysis flow

The repository currently exposes these scripts in `package.json`:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:migrate:deploy`
- `npm run prisma:studio`

Environment variables currently evidenced by the repository include:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NVIDIA_API_KEY`
- `NVIDIA_VISION_MODEL`
- `NVIDIA_API_BASE_URL` (optional in code, with a default)
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GCP_BUCKET_NAME`
- `GCP_PROJECT_ID`

Use `.env.example` as the starting point for local configuration.

## Current Scope

Lithdex is an actively evolving MVP/product codebase. This README is intended to describe the current implemented repository state conservatively:

- guided analysis workflow
- persisted owned analyses
- public publication semantics
- owner-guided result dispute and reanalysis
- community comments and feedback
- profile bio/avatar management

It does not document speculative roadmap features as if they already exist.
