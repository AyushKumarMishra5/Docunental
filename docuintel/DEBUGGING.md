# 🐛 Debugging Guide for Upload Issues

## Quick Diagnostic Checklist

If documents aren't analyzing, check these in order:

### 1. ✅ Is the dev server running?
```bash
# Check if running
lsof -ti:3000

# If not running, start it
pnpm dev
```

### 2. ✅ Open Browser Console
- Press **F12** or **Cmd+Option+I** (Mac)
- Go to **Console** tab
- Look for red error messages
- Screenshot any errors you see

### 3. ✅ Check Network Tab
- Press **F12** → **Network** tab
- Click "Analyze Documents"
- Look for `/api/upload` request
- Check if it's:
  - ✅ Status 200 (success)
  - ❌ Status 400/500 (error)
  - ❌ Failed/CORS error

### 4. ✅ Check Server Terminal
Look at the terminal where `pnpm dev` is running:
- Are there error messages?
- Does it show the upload request?

---

## Common Issues & Solutions

### Issue 1: "Upload failed" or No Response

**Possible Causes:**
- File too large
- Unsupported file type
- Server error

**Solutions:**
1. Check file size (should be < 10MB)
2. Try a different file (PDF or TXT)
3. Check server logs in terminal
4. Restart dev server: `Ctrl+C` then `pnpm dev`

### Issue 2: Stuck on "Analyzing..."

**Possible Causes:**
- Session creation failed
- Database adapter error
- AI adapter error (if using real API)

**Solutions:**
1. Check `.env.local` has `USE_MOCK=1`
2. Refresh the page and try again
3. Clear browser cookies for localhost:3000
4. Check terminal for errors

### Issue 3: "Cannot find module" errors

**Solution:**
```bash
# Reinstall dependencies
pnpm install

# Rebuild
pnpm build

# Restart
pnpm dev
```

### Issue 4: CORS or Network Error

**Solution:**
```bash
# Make sure you're accessing from localhost:3000
# NOT from 127.0.0.1:3000 or another port
```

---

## Manual Test with cURL

Test the upload API directly:

```bash
# Create a test file
echo "Test contract with automatically renew clause" > test.txt

# Test upload (replace with your actual file)
curl -X POST http://localhost:3000/api/upload \
  -F "files=@test.txt" \
  -v

# Expected: Status 200 with JSON response containing documentId
```

---

## Debug Mode

### Enable Detailed Logging

Add this to the top of `src/app/api/upload/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  console.log('=== UPLOAD REQUEST RECEIVED ===');
  console.log('Time:', new Date().toISOString());
  
  try {
    let sessionId = await getSessionId();
    console.log('Session ID:', sessionId);
    
    // ... rest of code
```

Then check your terminal for these logs when you upload.

---

## Verify Mock Adapter is Working

```bash
# Run the test suite
pnpm test

# Should see:
# PASS src/lib/__tests__/utils.test.ts
# Tests: 13 passed, 13 total
```

---

## Check Storage Directory

```bash
# Storage should exist
ls -la .docuintel/storage/

# If missing, create it
mkdir -p .docuintel/storage
```

---

## Quick Reset

If nothing works, try a full reset:

```bash
# 1. Stop the server (Ctrl+C)

# 2. Clear Next.js cache
rm -rf .next

# 3. Clear storage
rm -rf .docuintel

# 4. Reinstall
pnpm install

# 5. Rebuild
pnpm build

# 6. Start fresh
pnpm dev
```

---

## Getting Help

If you're still stuck, gather this info:

1. **Browser console errors** (screenshot)
2. **Network tab** (screenshot of failed request)
3. **Server terminal output** (copy/paste)
4. **What file are you uploading?** (type, size)
5. **What happens when you click "Analyze"?**

Then check:
- Browser DevTools Console (F12)
- Server terminal logs
- Run `./debug-upload.sh` for diagnostics

---

## Known Working Test

This should definitely work:

1. **Create test.txt:**
   ```bash
   echo "This is a test contract with unlimited liability and automatically renew clauses." > test.txt
   ```

2. **Upload via UI:**
   - Go to http://localhost:3000/analyze
   - Drop test.txt
   - Click "Analyze Documents"
   - Should navigate to results page

3. **If this works:** Your setup is fine, try a different file
4. **If this fails:** Check browser console and server logs

---

**Last Updated**: 2026-07-15  
**App Version**: 1.0.0  
**Status**: All tests passing, build successful
