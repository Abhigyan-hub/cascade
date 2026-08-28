-- CASCADE Event Management - Row Level Security Policies

-- =====================
-- ENABLE RLS ON ALL TABLES
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- =====================
-- HELPER: Get user role
-- =====================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================
-- HELPER: Is user admin of event
-- =====================
CREATE OR REPLACE FUNCTION public.is_event_admin(p_event_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND e.created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.event_admins ea
    WHERE ea.event_id = p_event_id AND ea.admin_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================
-- PROFILES
-- =====================
-- Public read for published profile data
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- Users can update own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Insert on signup (via trigger)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Developer can update any profile (role change)
CREATE POLICY "profiles_update_developer" ON public.profiles
  FOR UPDATE USING (public.get_user_role() = 'developer');

-- =====================
-- EVENTS
-- =====================
-- Anyone can view published events
CREATE POLICY "events_select_published" ON public.events
  FOR SELECT USING (
    is_published = true
    OR created_by = auth.uid()
    OR public.is_event_admin(id)
    OR public.get_user_role() = 'developer'
  );

-- Admins and developers can create events
CREATE POLICY "events_insert_admin" ON public.events
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'developer')
    AND created_by = auth.uid()
  );

-- Event owner, supporting admins, or developer can update
CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE USING (
    public.is_event_admin(id) OR public.get_user_role() = 'developer'
  );

-- Event owner or developer can delete
CREATE POLICY "events_delete_admin" ON public.events
  FOR DELETE USING (
    created_by = auth.uid() OR public.get_user_role() = 'developer'
  );

-- =====================
-- EVENT IMAGES
-- =====================
CREATE POLICY "event_images_select" ON public.event_images
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published = true)
    OR public.is_event_admin(event_id)
    OR public.get_user_role() = 'developer'
  );

CREATE POLICY "event_images_insert" ON public.event_images
  FOR INSERT WITH CHECK (public.is_event_admin(event_id) OR public.get_user_role() = 'developer');

CREATE POLICY "event_images_delete" ON public.event_images
  FOR DELETE USING (public.is_event_admin(event_id) OR public.get_user_role() = 'developer');

-- =====================
-- EVENT ADMINS
-- =====================
CREATE POLICY "event_admins_select" ON public.event_admins
  FOR SELECT USING (
    public.is_event_admin(event_id) OR public.get_user_role() = 'developer'
  );

CREATE POLICY "event_admins_insert" ON public.event_admins
  FOR INSERT WITH CHECK (
    (SELECT created_by FROM public.events WHERE id = event_id) = auth.uid()
    OR public.get_user_role() = 'developer'
  );

CREATE POLICY "event_admins_delete" ON public.event_admins
  FOR DELETE USING (
    (SELECT created_by FROM public.events WHERE id = event_id) = auth.uid()
    OR public.get_user_role() = 'developer'
  );

-- =====================
-- EVENT FORM FIELDS
-- =====================
CREATE POLICY "event_form_fields_select" ON public.event_form_fields
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.is_published = true)
    OR public.is_event_admin(event_id)
    OR public.get_user_role() = 'developer'
  );

CREATE POLICY "event_form_fields_all" ON public.event_form_fields
  FOR ALL USING (public.is_event_admin(event_id) OR public.get_user_role() = 'developer');

-- =====================
-- REGISTRATIONS
-- =====================
-- Clients see own, admins/developer see all for their events
CREATE POLICY "registrations_select" ON public.registrations
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_event_admin(event_id)
    OR public.get_user_role() = 'developer'
  );

CREATE POLICY "registrations_insert" ON public.registrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "registrations_update" ON public.registrations
  FOR UPDATE USING (
    user_id = auth.uid()
    OR public.is_event_admin(event_id)
    OR public.get_user_role() = 'developer'
  );

-- =====================
-- PAYMENTS
-- =====================
CREATE POLICY "payments_select" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id AND r.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.registrations r
      JOIN public.events e ON e.id = r.event_id
      WHERE r.id = registration_id AND (e.created_by = auth.uid() OR public.is_event_admin(e.id))
    )
    OR public.get_user_role() = 'developer'
  );

CREATE POLICY "payments_insert" ON public.payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.registrations r WHERE r.id = registration_id AND r.user_id = auth.uid())
  );

-- Service role / webhook can update payment status (via service role, bypasses RLS)

-- =====================
-- ACTIVITY LOGS
-- =====================
CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT USING (
    public.get_user_role() = 'developer'
    OR actor_id = auth.uid()
  );

CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
