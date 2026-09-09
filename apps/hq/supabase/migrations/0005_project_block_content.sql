-- Extend project_items to support a reusable document block data model.
-- This keeps the existing ordered project-item storage while adding a shared block schema.

alter table public.project_items
  add column if not exists type text not null default 'paragraph' check (
    type in (
      'paragraph',
      'heading1',
      'heading2',
      'heading3',
      'bullet_list',
      'numbered_list',
      'todo',
      'quote',
      'divider',
      'callout',
      'code',
      'table',
      'image',
      'gallery',
      'file',
      'video',
      'link',
      'toggle'
    )
  );

alter table public.project_items
  add column if not exists content text default '';

alter table public.project_items
  add column if not exists metadata jsonb default '{}'::jsonb;

update public.project_items
set type = coalesce(type, 'paragraph'),
    content = coalesce(content, coalesce(description, title, ''))
where true;

create index if not exists project_items_type_idx on public.project_items(type);
