# Supabase Storage Setup for Need Images

This guide will help you set up image uploads for the 4MK community platform.

## ✅ Good News: Bucket Already Exists!

Your Supabase project already has the `need-attachments` bucket configured. The image upload feature will use this existing bucket.

If you need to verify the configuration or add additional policies, follow the steps below.

## 1. Verify Storage Bucket

1. Log into your Supabase dashboard
2. Go to **Storage** in the left sidebar
3. You should see the `need-attachments` bucket already exists

## 2. Configure Bucket Policies

After creating the bucket, you need to set up policies to allow authenticated users to upload and delete their own images:

### Verify Upload Policy
1. In the Storage section, click on the `need-attachments` bucket
2. Click **Policies** tab
3. You should see 4 policies already configured
4. If needed, add a new policy:
   - **Policy name:** `Authenticated users can upload`
   - **Allowed operation:** `INSERT`
   - **Target roles:** `authenticated`
   - **WITH CHECK expression:**
     ```sql
     (bucket_id = 'need-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
     ```

### Verify Delete Policy
Ensure there's a policy that allows users to delete their own images:
   - **Policy name:** `Users can delete their own images`
   - **Allowed operation:** `DELETE`
   - **Target roles:** `authenticated`
   - **USING expression:**
     ```sql
     (bucket_id = 'need-attachments'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)
     ```

### Verify Read Policy (Public Access)
Ensure images can be viewed publicly:
   - **Policy name:** `Public can view images`
   - **Allowed operation:** `SELECT`
   - **Target roles:** `public`, `authenticated`
   - **USING expression:**
     ```sql
     bucket_id = 'need-attachments'::text
     ```

## 3. Add Database Column

Run this SQL in your Supabase SQL Editor:

```sql
-- Add images column to needs table
ALTER TABLE needs 
ADD COLUMN IF NOT EXISTS images text[];

-- Add comment for documentation
COMMENT ON COLUMN needs.images IS 'Array of Supabase Storage URLs for uploaded images (max 3)';
```

## 4. Configure CORS (if needed)

If you encounter CORS issues when uploading from your Replit domain:

1. Go to **Settings** > **API** in Supabase
2. Add your Replit domain to the **Additional Allowed Origins** field
3. Format: `https://your-repl-name.replit.app` (or your custom domain)

## 5. Optional: Set Lifecycle Policies

To automatically delete old/orphaned images (recommended for sustainability):

1. In Storage, click your `need-attachments` bucket
2. Click **Settings**
3. Configure cleanup rules (e.g., delete files older than 90 days if not referenced in database)

---

## How It Works

1. **User selects image** → Automatically compressed to max 800px / 500KB
2. **Upload** → Saved to Supabase Storage at `need-attachments/{user_id}/{timestamp}-{filename}.jpg`
3. **URL stored** → Public URL saved in database `needs.images` array
4. **Display** → Images shown in need listings and receipts

## Troubleshooting

### Upload Fails
- Check bucket policies are correctly configured
- Verify user is authenticated
- Check browser console for error messages

### Images Not Displaying
- Verify bucket is set to **Public**
- Check image URLs are valid Supabase storage URLs
- Verify read policy allows public access

### CORS Errors
- Add your domain to Supabase allowed origins
- Make sure you're using the public URL from Supabase storage

---

## Cost Considerations

Supabase Free Tier includes:
- **1GB storage** (plenty for compressed images at ~100KB each = ~10,000 images)
- **2GB bandwidth per month**

For a charity app, this should be sufficient. Images are auto-compressed to minimize storage use.
