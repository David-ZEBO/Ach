-- =====================================================================
-- Salle virtuelle réservée aux étudiants universitaires de la même faculté.
--
-- La salle virtuelle d'un cours (classes virtuelles et échéances du calendrier, annonces du cours,
-- forum) n'existe que pour un cours universitaire (unité d'enseignement d'un programme).
-- Elle est accessible :
--   * aux formateurs du cours et à l'administration (gestionnaires) ;
--   * aux étudiants inscrits (programme_enrollments actif ou terminé) à un programme
--     de la même faculté que ce cours, en plus de leur inscription au cours.
--
-- Mise en œuvre par des politiques RESTRICTIVES : elles s'ajoutent (ET logique) aux politiques
-- existantes, qui ne sont ni supprimées ni modifiées. Les événements et annonces généraux
-- (course_id null) ne sont pas concernés.
-- =====================================================================

create function private.can_use_virtual_room(_course_id uuid) returns boolean
  language sql stable security definer set search_path to ''
as $$
  select private.can_manage_course(_course_id)
      or private.is_staff()
      or exists (
        select 1
        from public.programme_units pu
        join public.programmes p on p.id = pu.programme_id
        join public.programmes p2 on p2.faculty_id = p.faculty_id
        join public.programme_enrollments pe on pe.programme_id = p2.id
        join public.profiles pr on pr.id = pe.user_id
        where pu.course_id = _course_id
          and pe.user_id = (select auth.uid())
          and pe.status in ('active', 'completed')
          and pr.status = 'active'
      );
$$;
comment on function private.can_use_virtual_room(uuid) is 'Salle virtuelle : gestionnaire du cours, staff, ou étudiant d’un programme de la même faculté que ce cours universitaire.';

-- Vrai si le cours est une unité d'enseignement universitaire et que l'utilisateur peut entrer dans sa salle.
create function public.virtual_room_access(p_course_id uuid) returns jsonb
  language sql stable security definer set search_path to ''
as $$
  select jsonb_build_object(
    'is_university', exists (select 1 from public.programme_units where course_id = p_course_id),
    'allowed', exists (select 1 from public.programme_units where course_id = p_course_id) and private.can_use_virtual_room(p_course_id)
  );
$$;

-- Politiques restrictives (ajoutées aux politiques existantes) -----------
create policy "salle virtuelle : séances réservées" on public.calendar_events as restrictive
  for all to authenticated
  using (course_id is null or private.can_use_virtual_room(course_id))
  with check (course_id is null or private.can_use_virtual_room(course_id));

create policy "salle virtuelle : annonces réservées" on public.announcements as restrictive
  for all to authenticated
  using (course_id is null or private.can_use_virtual_room(course_id))
  with check (course_id is null or private.can_use_virtual_room(course_id));

create policy "salle virtuelle : forum réservé" on public.discussions as restrictive
  for all to authenticated
  using (private.can_use_virtual_room(course_id))
  with check (private.can_use_virtual_room(course_id));

create policy "salle virtuelle : messages du forum réservés" on public.discussion_posts as restrictive
  for all to authenticated
  using (private.can_use_virtual_room(course_id))
  with check (private.can_use_virtual_room(course_id));

revoke all on function private.can_use_virtual_room(uuid) from public, anon;
revoke all on function public.virtual_room_access(uuid) from public, anon;
grant execute on function private.can_use_virtual_room(uuid) to authenticated;
grant execute on function public.virtual_room_access(uuid) to authenticated;
