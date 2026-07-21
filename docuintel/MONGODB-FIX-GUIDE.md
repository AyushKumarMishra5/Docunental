# MongoDB Atlas Authentication Fix Guide

## Current Issue
Authentication is failing with error: "bad auth : Authentication failed."

## Connection Details
- Cluster: hms.j0zylph.mongodb.net
- Username: professor
- Password: 12345recruiter
- Database: docuintel

## Steps to Fix

### Option 1: Fix IP Whitelist (Most Common Issue)

1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Select your cluster (hms)
3. Click on "Network Access" in the left sidebar
4. Click "Add IP Address"
5. Choose one of:
   - **"Allow Access from Anywhere"** (0.0.0.0/0) - Easiest for development
   - Or add your current IP address specifically

### Option 2: Verify/Reset User Credentials

1. Go to "Database Access" in MongoDB Atlas
2. Find user "professor"
3. Check if user exists and has correct permissions
4. If needed, edit the user:
   - Set password to: `12345recruiter`
   - Ensure role is: `readWrite` on database `docuintel` (or `readWriteAnyDatabase`)
5. Save changes

### Option 3: Create New Database User

If the user doesn't exist or has issues:

1. Go to "Database Access"
2. Click "Add New Database User"
3. Set:
   - Username: `professor`
   - Password: `12345recruiter`
   - Database User Privileges: `Read and write to any database`
4. Click "Add User"

### Option 4: Test with Connection String from Atlas

1. In MongoDB Atlas, click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Update `.env.local` with the new connection string

## Quick Test Commands

After making changes in Atlas, wait 1-2 minutes for changes to propagate, then run:

```bash
# Test connection
node test-mongo-connection.js

# Test full integration
./test-mongodb.sh
```

## Alternative: Use Local MongoDB

If Atlas continues to have issues, you can use local MongoDB:

```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Update .env.local
MONGODB_URI=mongodb://localhost:27017/docuintel
```

## Current Date/Time
2026-07-21 05:52 UTC

## Next Steps
1. Follow one of the options above
2. Wait 1-2 minutes after making changes
3. Let me know when ready to test
