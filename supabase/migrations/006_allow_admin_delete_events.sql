-- Allow admins to delete events created by anyone
-- Update the events_delete_admin policy to include admin role

DROP POLICY IF EXISTS "events_delete_admin" ON public.events;

CREATE POLICY "events_delete_admin" ON public.events
  FOR DELETE USING (
    created_by = auth.uid() 
    OR public.get_user_role() = 'developer'
    OR public.get_user_role() = 'admin'
  );
