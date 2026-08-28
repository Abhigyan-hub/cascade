-- Fix UPDATE policy for registrations: ensure WITH CHECK is set
-- Some Postgres/RLS setups can block UPDATE without an explicit WITH CHECK.

DROP POLICY IF EXISTS "registrations_update" ON public.registrations;

CREATE POLICY "registrations_update" ON public.registrations
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.is_event_admin(event_id)
    OR public.get_user_role() = 'developer'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_event_admin(event_id)
    OR public.get_user_role() = 'developer'
  );

