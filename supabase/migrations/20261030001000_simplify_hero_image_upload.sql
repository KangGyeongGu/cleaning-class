update public.site_config as config
set hero_images = (
  select jsonb_object_agg(devices.key, (
    select jsonb_object_agg(slots.key, case when slots.value = 'null'::jsonb then slots.value else slots.value - 'originalPath' - 'crop' end)
    from jsonb_each(devices.value) as slots
  ))
  from jsonb_each(config.hero_images) as devices
);

create or replace function public.update_hero_image_variant(p_id uuid, p_device text, p_side text, p_expected jsonb, p_asset jsonb)
returns text[]
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_row public.site_config%rowtype;
  old_asset jsonb;
  next_images jsonb;
  unused_paths text[];
begin
  if auth.uid() is null or p_device not in ('pc', 'mobile') or p_side not in ('left', 'right') then
    raise exception 'Invalid hero image request' using errcode = '22023';
  end if;
  if p_asset is null or jsonb_typeof(p_asset) <> 'object'
     or not (p_asset ?& array['displayPath', 'focalX', 'focalY'])
     or coalesce(p_asset ->> 'displayPath', '') = '' then
    raise exception 'Invalid hero image asset' using errcode = '22023';
  end if;
  select * into current_row from public.site_config where id = p_id for update;
  if not found then raise exception 'Site config not found' using errcode = 'P0002'; end if;
  old_asset := current_row.hero_images #> array[p_device, p_side];
  if old_asset is distinct from coalesce(p_expected, 'null'::jsonb) then
    raise exception 'Hero image changed; reload before saving' using errcode = '40001';
  end if;
  next_images := jsonb_set(current_row.hero_images, array[p_device, p_side], p_asset);
  update public.site_config set hero_images = next_images, updated_at = now() where id = p_id;
  select coalesce(array_agg(distinct candidate), array[]::text[]) into unused_paths
  from unnest(array[old_asset ->> 'displayPath']) as candidate
  where candidate is not null and candidate <> ''
    and candidate is distinct from current_row.hero_image_path
    and candidate is distinct from current_row.hero_image_path_2
    and not exists (
      select 1 from jsonb_each(next_images) as devices, jsonb_each(devices.value) as slots
      where slots.value ->> 'displayPath' = candidate
    );
  return unused_paths;
end;
$$;
revoke all on function public.update_hero_image_variant(uuid, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.update_hero_image_variant(uuid, text, text, jsonb, jsonb) to authenticated;
