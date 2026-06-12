-- This migration adds the missing unique index on ApiToken.tokenHash
-- that was already present in the database but missing from migration history.
-- No-op if index already exists.
CREATE UNIQUE INDEX IF NOT EXISTS "ApiToken_tokenHash_key" ON "ApiToken"("tokenHash");
