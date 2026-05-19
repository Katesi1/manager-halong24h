-- Halong24h MVP — Storage bucket + policies
-- Lưu ý: bucket "halong24h" cần được tạo trước trong Dashboard → Storage → New bucket (Public)

-- Bucket structure:
--   halong24h/
--     properties/{property_id}/{filename}     -- ảnh property
--     rooms/{room_id}/{filename}              -- ảnh room
--     avatars/{user_id}/{filename}            -- avatar profile

-- Public read cho mọi object
create policy "Public read on halong24h bucket"
  on storage.objects for select
  using (bucket_id = 'halong24h');

-- Authenticated upload
create policy "Authenticated upload to halong24h"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'halong24h');

-- Owner xóa object thuộc property của mình
-- Đường dẫn: properties/{property_id}/...
-- Nên enforce ở app layer để đơn giản; ở đây cho phép authenticated delete
create policy "Authenticated delete on own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'halong24h'
    and (
      -- avatars/{uid}/...
      (storage.foldername(name))[1] = 'avatars'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
  );

-- Note: với properties/rooms folder, kiểm soát xóa ở server action (route handler)
-- bằng service role + check ownership từ DB. RLS policy ở đây chỉ là layer phòng vệ.
