# Private property reference photos

Properties → Property photos: admin, operations and the owning client can upload JPEG/PNG/WebP (5 MB maximum), add a caption and delete photos. Assigned property managers can read. Job details include the guide; cleaner access requires their own job in ACCEPTED, EN_ROUTE, ARRIVED or CLEANING. Terminal and reassigned jobs deny new reads.

Metadata table and dedicated private bucket are provisioned by `supabase/changes/property_reference_photos.sql` (production migration name `property_reference_photos`). Apply once before deploying `st-api`. Deploy all modules, including `property-photos.mjs`. Upload `Shine_Time_property_photos.zip` contents to `public_html/app`.

Files are served through authenticated API reads; storage paths and signed bearer URLs are never returned. Direct Storage access is denied by a restrictive policy. Reusing a photo ID checks its object scope. Every read rechecks authorization; already delivered bytes or screenshots cannot be revoked. Content hashes make upload retries reuse the same file/metadata row. Re-uploading the same image updates its caption. Captions and thumbnails display in upload order, 12 per page. Click a thumbnail to view full proportions.

Validated: TypeScript and production build; 18 focused route, storage policy and frontend checks. Production user photos are not used for tests. Browser interaction was not tested for this release.
