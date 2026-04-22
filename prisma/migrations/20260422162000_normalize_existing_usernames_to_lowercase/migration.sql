-- Normalize legacy mixed-case handles to the canonical lowercase username rule.
UPDATE "User"
SET "username" = LOWER("username")
WHERE "username" <> LOWER("username");
