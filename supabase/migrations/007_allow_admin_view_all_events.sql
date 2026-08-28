-- Allow admins to view all events (not just published ones or ones they created)
-- This is needed so admins can see and delete events created by anyone

DROP POLICY IF EXISTS "events_select_published" ON public.events;

CREATE POLICY "events_select_published" ON public.events
  FOR SELECT USING (
    is_published = true
    OR created_by = auth.uid()
    OR public.is_event_admin(id)
    OR public.get_user_role() = 'developer'
    OR public.get_user_role() = 'admin'
  );
