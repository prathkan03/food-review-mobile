-- Enable trigram extension for fuzzy text matching
create extension if not exists pg_trgm;

-- GIN indexes on username and display_name for fast trigram lookups
create index if not exists idx_profiles_username_trgm
  on profiles using gin(username gin_trgm_ops);

create index if not exists idx_profiles_display_name_trgm
  on profiles using gin(display_name gin_trgm_ops);

-- search_profiles: ranked fuzzy search across username and display_name.
-- Uses ILIKE for short queries (trigrams need 3+ chars) and layered
-- ordering: exact prefix > similarity score > alphabetical.
create or replace function search_profiles(
  query       text,
  limit_count int default 20
)
returns table (
  id               uuid,
  username         text,
  display_name     text,
  avatar_url       text,
  bio              text,
  similarity_score float4
)
language sql
security definer
stable
set search_path = public
as $$
  with candidates as (
    select
      p.id,
      p.username,
      p.display_name,
      p.avatar_url,
      p.bio,
      greatest(
        coalesce(similarity(lower(p.username),                    lower(trim(query))), 0),
        coalesce(similarity(lower(coalesce(p.display_name, '')), lower(trim(query))), 0)
      ) as similarity_score
    from profiles p
    where
      p.username is not null
      and length(trim(query)) > 0
      and (
        lower(p.username)                    ilike '%' || lower(trim(query)) || '%'
        or lower(coalesce(p.display_name, '')) ilike '%' || lower(trim(query)) || '%'
      )
  )
  select id, username, display_name, avatar_url, bio, similarity_score
  from candidates
  order by
    -- Exact prefix match ranks highest
    case when lower(username) like lower(trim(query)) || '%' then 0 else 1 end asc,
    similarity_score desc,
    username asc
  limit limit_count;
$$;

-- Grant execution rights to Supabase roles
grant execute on function search_profiles(text, int) to anon, authenticated;
