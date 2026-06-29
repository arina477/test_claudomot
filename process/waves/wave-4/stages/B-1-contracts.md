# Wave 4 — B-1 Contracts (39a043e)
packages/shared/src/profile.ts extended: ProfileResponse {displayName,username,avatarUrl,accentColor}; UpdateProfile {displayName?,username?,accentColor?} (username regex ^[a-z0-9_]{3,20}$ — spec wins); AvatarPresignResponse {uploadUrl,key}. Exported.
