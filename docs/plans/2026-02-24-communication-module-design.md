# Communication Module Design

## Overview

New "Communication" module for CRM Propulseo ERP to manage content production across agency, personal, and client communications. Focused on organization + production workflow, no analytics.

## Database Schema

### Tables

**posts** - Central entity for all content
- FK to `users` via `responsible_user_id`
- Optional FK to `clients` via `client_id` (when type='client')
- Status workflow: idea → drafting → review → scheduled → published
- Type categories: agence, perso, client
- Platforms: linkedin, instagram, newsletter, multi

**post_assets** - Attached media/documents
- FK to `posts` (cascade delete)
- Supports both Supabase Storage uploads and external URLs
- `storage_path` for Supabase Storage, `asset_url` for external links

**post_comments** - Internal collaboration thread
- FK to `posts` (cascade delete)
- FK to `users` via `author_id`

### Indexes
- `posts.status`, `posts.type`, `posts.scheduled_at`, `posts.responsible_user_id`, `posts.client_id`
- `post_assets.post_id`
- `post_comments.post_id`

### RLS
- Authenticated users: full CRUD on all 3 tables
- Storage bucket `post-assets`: authenticated upload, public read

## Frontend Architecture

### Module Structure
```
src/modules/Communication/
├── index.tsx                    # Export, hook composition
├── types.ts                     # PostRow, PostAsset, PostComment types
├── CommunicationPage.tsx        # Layout with tabs
├── hooks/
│   ├── useCommunicationData.ts  # Data aggregation
│   ├── useCommunicationFilters.ts
│   └── useCommunicationActions.ts
├── components/
│   ├── CommunicationHeader.tsx
│   ├── CommunicationFilters.tsx
│   ├── KanbanBoard.tsx          # Default view, drag & drop
│   ├── KanbanColumn.tsx
│   ├── KanbanCard.tsx
│   ├── CalendarView.tsx         # FullCalendar integration
│   ├── DashboardView.tsx        # Summary view
│   ├── PostDetail.tsx           # Detailed post panel
│   ├── PostForm.tsx             # Create/edit form
│   ├── AssetManager.tsx         # Upload + external URLs
│   └── CommentThread.tsx        # Comment thread
```

### Views (Tabs)
1. **Kanban** (default) - 5 columns: Idee, En redaction, En validation, Programme, Publie
2. **Calendrier** - FullCalendar with scheduled_at, filterable
3. **Dashboard** - Weekly posts, overdue, recent, type distribution chart

### Integration Points
- Sidebar: New "Communication" section with MessageSquare icon
- Layout.tsx: New lazy-loaded case 'communication'
- Supabase hooks: useSupabasePosts, usePostsCRUD in src/hooks/supabase/
- Storage: New bucket 'post-assets'

## Design Decisions
- Kanban as default view (user preference)
- FK to clients table for client-type posts
- Both Supabase Storage + external URLs for assets
- Dedicated sidebar section (not nested under CRM)
- No new store slice needed (data via Supabase hooks)
- Uses @dnd-kit/core for drag & drop (lightweight, accessible)
- Follows CRM module pattern for consistency
