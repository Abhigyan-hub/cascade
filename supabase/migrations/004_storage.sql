-- Storage bucket for event images (run in Supabase if not using config.toml)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow authenticated upload for admins (enforced at app level)
CREATE POLICY "event_images_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "event_images_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-images');

CREATE POLICY "event_images_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-images');
