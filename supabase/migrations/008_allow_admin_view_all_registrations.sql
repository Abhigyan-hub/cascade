-- Allow admins to view all registrations (not just for events they created)
-- This is needed so admins can see and manage registrations for any event

DROP POLICY IF EXISTS "registrations_select" ON public.registrations;

CREATE POLICY "registrations_select" ON public.registrations
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_event_admin(event_id)
    OR public.get_user_role() = 'developer'
    OR public.get_user_role() = 'admin'
  );
