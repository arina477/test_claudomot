CONCERN: The two-step avatar upload process, where the client uploads directly to storage and then makes a separate API call to confirm, creates a failure mode that is not addressed. If the client successfully uploads the file but fails to make the confirmation call, the file becomes an orphan in the storage bucket, leading to unreferenced data and storage bloat over time.

EVIDENCE: "On upload-complete, PATCH /profile (or a confirm endpoint) records avatar_url from the server-controlled key."

SUGGESTION: Use a storage event trigger (e.g., S3 Event Notification -> Lambda) to process the upload and update the database, which removes the client confirmation step and its associated failure mode.
