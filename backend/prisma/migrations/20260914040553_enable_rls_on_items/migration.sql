-- Enable Row Level Security on the Item table
ALTER TABLE "Item" ENABLE ROW LEVEL SECURITY;

-- Deny all access by default to anyone not authenticated via Supabase Auth
-- (the "anon" role gets no policies at all, so it matches nothing)

-- Authenticated users may only see their own items
CREATE POLICY "Users can view their own items"
ON "Item" FOR SELECT
TO authenticated
USING (auth.uid()::text = "ownerId");

-- Authenticated users may only insert items owned by themselves
CREATE POLICY "Users can insert their own items"
ON "Item" FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = "ownerId");

-- Authenticated users may only update their own items
CREATE POLICY "Users can update their own items"
ON "Item" FOR UPDATE
TO authenticated
USING (auth.uid()::text = "ownerId")
WITH CHECK (auth.uid()::text = "ownerId");

-- Authenticated users may only delete their own items
CREATE POLICY "Users can delete their own items"
ON "Item" FOR DELETE
TO authenticated
USING (auth.uid()::text = "ownerId");
