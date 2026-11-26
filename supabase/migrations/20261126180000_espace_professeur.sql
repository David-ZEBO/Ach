-- =====================================================================
-- Espace professeur : candidatures des enseignants, professeurs par faculté,
-- création de cours par les formateurs, soumission pour relecture.
--
-- Principe : tout est validé par un administrateur.
--   * Formateur (cours courts) : demande -> admin accepte -> rôle « instructor ».
--   * Professeur d'université : demande par faculté avec CV -> admin accepte ->
--     rôle « instructor » + rattachement à la faculté (faculty_teachers).
--   * Les cours créés par un professeur restent en brouillon ; il les soumet,
--     un administrateur les relit et les publie (seul l'admin peut publier).
--
-- Migration additive : aucune table, colonne ou politique existante n'est
-- supprimée ni modifiée (une seule colonne facultative ajoutée à courses).
-- =====================================================================

-- 1. Candidatures des enseignants ------------------------------------
create table public.teacher_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('trainer', 'university')),
  faculty_id uuid references public.faculties(id) on delete set null,
  expertise text not null default '' check (char_length(expertise) <= 300),
  motivation text not null default '' check (char_length(motivation) <= 3000),
  cv_path text check (char_length(cv_path) <= 500),
  cv_name text check (char_length(cv_name) <= 255),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  admin_message text not null default '' check (char_length(admin_message) <= 1000),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Une demande universitaire vise une faculté et comporte un CV.
  constraint teacher_applications_university_check check (kind = 'trainer' or (faculty_id is not null and cv_path is not null))
);
comment on table public.teacher_applications is 'Demandes pour enseigner à l’ACH (formateur ou professeur d’université), validées par un administrateur.';

-- Une seule demande en attente par personne, type et faculté.
create unique index teacher_applications_one_pending
  on public.teacher_applications (user_id, kind, coalesce(faculty_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'pending';
create index teacher_applications_status_idx on public.teacher_applications (status, created_at desc);

create trigger teacher_applications_set_updated_at before update on public.teacher_applications
  for each row execute function public.set_updated_at();

alter table public.teacher_applications enable row level security;

create policy "teacher_applications: lecture des siennes ou admin" on public.teacher_applications
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "teacher_applications: dépôt par le candidat" on public.teacher_applications
  for insert to authenticated with check (
    user_id = (select auth.uid()) and status = 'pending' and reviewed_by is null and reviewed_at is null and admin_message = ''
  );
-- Les décisions passent par admin_decide_teacher_application (aucune autre écriture directe).

-- 2. Professeurs rattachés à une faculté ------------------------------
create table public.faculty_teachers (
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  approved_by uuid references auth.users(id) on delete set null,
  application_id uuid references public.teacher_applications(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (faculty_id, user_id)
);
comment on table public.faculty_teachers is 'Professeurs d’université autorisés à créer des unités d’enseignement dans une faculté.';
alter table public.faculty_teachers enable row level security;
create policy "faculty_teachers: lecture des siens ou admin" on public.faculty_teachers
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "faculty_teachers: retrait par admin" on public.faculty_teachers
  for delete to authenticated using ((select private.is_admin()));

create function private.is_faculty_teacher(_faculty_id uuid) returns boolean
  language sql stable security definer set search_path to ''
as $$
  select exists (
    select 1 from public.faculty_teachers ft join public.profiles p on p.id = ft.user_id
    where ft.faculty_id = _faculty_id and ft.user_id = (select auth.uid()) and p.status = 'active'
  ) and private.has_role('instructor');
$$;

-- 3. Soumission d'un cours pour relecture -----------------------------
alter table public.courses add column review_requested_at timestamptz;
comment on column public.courses.review_requested_at is 'Date à laquelle le professeur a soumis le brouillon pour relecture (remise à null à la publication).';

-- 4. CV des candidats (stockage privé) --------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teacher-cvs', 'teacher-cvs', false, 10485760,
        array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy "teacher-cvs: dépôt par le candidat" on storage.objects
  for insert to authenticated with check (bucket_id = 'teacher-cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "teacher-cvs: lecture candidat ou admin" on storage.objects
  for select to authenticated using (bucket_id = 'teacher-cvs' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_admin())));

-- Couvertures : un professeur peut déposer celle de ses propres cours (dossier = id du cours).
create policy "covers: dépôt par l'enseignant du cours" on storage.objects
  for insert to authenticated with check (bucket_id = 'course-covers' and private.can_manage_course(private.try_uuid((storage.foldername(name))[1])));

-- 5. Décision de l'administrateur -------------------------------------
create function public.admin_decide_teacher_application(p_application_id uuid, p_approve boolean, p_message text default '')
  returns public.teacher_applications
  language plpgsql security definer set search_path to ''
as $$
declare
  v_app public.teacher_applications;
  v_msg text := left(btrim(coalesce(p_message, '')), 1000);
begin
  perform private.assert_admin();
  select * into v_app from public.teacher_applications where id = p_application_id for update;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  if v_app.status <> 'pending' then raise exception 'invalid_transition' using errcode = 'P0001'; end if;

  update public.teacher_applications
     set status = case when p_approve then 'approved' else 'rejected' end,
         admin_message = v_msg, reviewed_by = (select auth.uid()), reviewed_at = now()
   where id = p_application_id
  returning * into v_app;

  if p_approve then
    insert into public.user_roles (user_id, role, granted_by)
    values (v_app.user_id, 'instructor', (select auth.uid()))
    on conflict (user_id, role) do nothing;
    if v_app.kind = 'university' then
      insert into public.faculty_teachers (faculty_id, user_id, approved_by, application_id)
      values (v_app.faculty_id, v_app.user_id, (select auth.uid()), v_app.id)
      on conflict (faculty_id, user_id) do nothing;
    end if;
  end if;

  insert into public.notifications (user_id, kind, payload, link)
  values (v_app.user_id, 'system',
          jsonb_build_object('type', 'teacher_application', 'approved', p_approve, 'message', v_msg),
          case when p_approve then '/professeur' else '/professeur/candidature' end);

  perform public.write_audit_log(case when p_approve then 'teacher_approve' else 'teacher_reject' end,
    'teacher_applications', v_app.id::text, jsonb_build_object('kind', v_app.kind, 'faculty_id', v_app.faculty_id));
  return v_app;
end;
$$;

-- 6. Création d'un cours par un professeur ----------------------------
create function public.instructor_create_course(
  p_title text, p_subtitle text, p_short_description text, p_category_id uuid, p_level public.course_level,
  p_duration_minutes integer, p_modules text[],
  p_programme_id uuid default null, p_semester smallint default null, p_credits smallint default 0
) returns uuid
  language plpgsql security definer set search_path to ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_slug text;
  v_base text;
  v_faculty uuid;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '42501'; end if;
  if not private.has_role('instructor') or not exists (select 1 from public.profiles where id = v_uid and status = 'active') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(btrim(p_title), '') = '' then raise exception 'invalid_input' using errcode = '22023'; end if;

  -- Unité d'enseignement universitaire : uniquement dans une faculté où le professeur est admis.
  if p_programme_id is not null then
    select faculty_id into v_faculty from public.programmes where id = p_programme_id;
    if v_faculty is null or not private.is_faculty_teacher(v_faculty) then
      raise exception 'not_faculty_teacher' using errcode = '42501';
    end if;
    if p_semester is null or p_semester < 1 or p_semester > 12 then raise exception 'invalid_semester' using errcode = '22023'; end if;
  end if;

  -- Adresse unique dérivée du titre.
  v_base := left(trim(both '-' from regexp_replace(lower(translate(btrim(p_title),
    'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸŒÆ’''',
    'aaaaaaceeeeiiiinooooouuuuyyoeaaaaaaceeeeiiiinooooouuuuyyoe--')), '[^a-z0-9]+', '-', 'g')), 100);
  if v_base = '' then v_base := 'cours'; end if;
  v_slug := v_base;
  while exists (select 1 from public.courses where slug = v_slug) loop
    v_slug := v_base || '-' || substr(md5(gen_random_uuid()::text), 1, 5);
  end loop;

  insert into public.courses (slug, teaching_language, category_id, level, price_amount, currency, duration_minutes,
                              instructor_name, certificate_enabled, require_all_lessons, status, created_by)
  values (v_slug, 'fr', p_category_id, coalesce(p_level, 'beginner'), 0, 'USD', greatest(coalesce(p_duration_minutes, 0), 0),
          nullif(private.display_name(v_uid), ''), true, true, 'draft', v_uid)
  returning id into v_id;

  insert into public.course_translations (course_id, language, title, subtitle, short_description)
  values (v_id, 'fr', left(btrim(p_title), 200), left(coalesce(btrim(p_subtitle), ''), 300), left(coalesce(btrim(p_short_description), ''), 500));

  insert into public.modules (course_id, position, title)
  select v_id, row_number() over (order by o.ord) - 1, left(btrim(o.title), 200)
    from unnest(coalesce(p_modules, '{}')) with ordinality as o(title, ord)
   where btrim(o.title) <> '';

  insert into public.course_instructors (course_id, user_id, role, assigned_by) values (v_id, v_uid, 'lead', v_uid);

  if p_programme_id is not null then
    insert into public.programme_units (programme_id, semester, position, course_id, credits, is_mandatory)
    values (p_programme_id, p_semester,
            coalesce((select max(position) + 1 from public.programme_units where programme_id = p_programme_id and semester = p_semester), 0),
            v_id, least(greatest(coalesce(p_credits, 0), 0), 60), true);
  end if;

  perform public.write_audit_log('course_create_by_instructor', 'courses', v_id::text, jsonb_build_object('programme_id', p_programme_id));
  return v_id;
end;
$$;

-- 7. Modification des caractéristiques d'un brouillon par son professeur
create function public.instructor_update_course(p_course_id uuid, p_category_id uuid, p_level public.course_level,
  p_duration_minutes integer, p_cover_path text, p_instructor_name text)
  returns void language plpgsql security definer set search_path to ''
as $$
begin
  if not private.is_course_teacher(p_course_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.courses where id = p_course_id and status = 'draft') then
    raise exception 'not_draft' using errcode = 'P0001';
  end if;
  update public.courses
     set category_id = p_category_id, level = coalesce(p_level, level), duration_minutes = greatest(coalesce(p_duration_minutes, 0), 0),
         cover_path = nullif(left(btrim(coalesce(p_cover_path, '')), 500), ''), instructor_name = nullif(left(btrim(coalesce(p_instructor_name, '')), 120), '')
   where id = p_course_id;
end;
$$;

-- 8. Soumission pour relecture (l'admin publie) -----------------------
create function public.instructor_submit_course(p_course_id uuid)
  returns void language plpgsql security definer set search_path to ''
as $$
declare v_title text;
begin
  if not private.is_course_teacher(p_course_id) then raise exception 'forbidden' using errcode = '42501'; end if;
  if not exists (select 1 from public.courses where id = p_course_id and status = 'draft') then
    raise exception 'not_draft' using errcode = 'P0001';
  end if;
  if private.course_lesson_total(p_course_id) = 0 then raise exception 'course_empty' using errcode = 'P0001'; end if;
  update public.courses set review_requested_at = now() where id = p_course_id;
  select title into v_title from public.course_translations where course_id = p_course_id and language = 'fr';
  insert into public.notifications (user_id, kind, payload, link)
  select r.user_id, 'system', jsonb_build_object('type', 'course_review', 'course_id', p_course_id, 'title', v_title), '/admin/formations/' || p_course_id::text
    from public.user_roles r where r.role = 'admin';
  perform public.write_audit_log('course_submit_review', 'courses', p_course_id::text, '{}'::jsonb);
end;
$$;

-- Droits d'exécution : utilisateurs connectés uniquement (contrôles faits dans les fonctions).
revoke all on function public.admin_decide_teacher_application(uuid, boolean, text) from public, anon;
revoke all on function public.instructor_create_course(text, text, text, uuid, public.course_level, integer, text[], uuid, smallint, smallint) from public, anon;
revoke all on function public.instructor_update_course(uuid, uuid, public.course_level, integer, text, text) from public, anon;
revoke all on function public.instructor_submit_course(uuid) from public, anon;
revoke all on function private.is_faculty_teacher(uuid) from public, anon;
grant execute on function public.admin_decide_teacher_application(uuid, boolean, text) to authenticated;
grant execute on function public.instructor_create_course(text, text, text, uuid, public.course_level, integer, text[], uuid, smallint, smallint) to authenticated;
grant execute on function public.instructor_update_course(uuid, uuid, public.course_level, integer, text, text) to authenticated;
grant execute on function public.instructor_submit_course(uuid) to authenticated;
grant execute on function private.is_faculty_teacher(uuid) to authenticated;
grant select, insert on public.teacher_applications to authenticated;
grant select, delete on public.faculty_teachers to authenticated;
