# Setting Up Firebase Firestore as Backup Database

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Fill in details:
   - **Project name**: `deora-plaza-backup`
   - **Enable Google Analytics**: Optional
   - **Choose analytics account**: Default or create new

## Step 2: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in production mode** (we'll configure rules later)
4. Select a **location** (choose same region as your Supabase for better performance)

## Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" → Web app (</>) 
4. Register app with name: `deora-plaza-web`
5. Copy the Firebase config object

## Step 4: Install Firebase Dependencies

```bash
npm install firebase
```

## Step 5: Update Environment Variables

Add these to your `.env.local`:

```env
# Firebase Backup Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 6: Configure Firestore Security Rules

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Step 7: Set Up Data Synchronization

The system will automatically sync data between Supabase (primary) and Firestore (backup):

1. **Real-time sync**: Changes in Supabase trigger Firestore updates
2. **Failover sync**: When Supabase is down, read from Firestore
3. **Recovery sync**: When Supabase comes back, sync any missed changes

## Alternative: Quick Fix (Disable Backup)

If you want to disable backup functionality for now, add this to `.env.local`:

```env
# Disable backup server
DISABLE_BACKUP_SERVER=true
```

## Testing the Setup

Once configured, test the backup system:

```bash
# Test backup connection
npx tsx test-backup-connection.ts
```

Would you like me to create the test script or help with any specific step?