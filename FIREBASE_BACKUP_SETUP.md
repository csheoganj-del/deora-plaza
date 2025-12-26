# 🔥 Firebase Backup Database Setup Guide

This guide will help you set up Firebase Firestore as a backup database for your DEORA Plaza system, providing redundancy alongside your primary Supabase database.

## 🎯 Architecture Overview

```
Primary: Supabase (PostgreSQL) ←→ Sync Engine ←→ Backup: Firebase (Firestore)
                                       ↓
                              Automatic Failover
```

## 📋 Step-by-Step Setup

### Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create New Project**:
   - Click "Create a project" or "Add project"
   - Project name: `deora-plaza-backup`
   - Enable Google Analytics: **Optional** (recommended for monitoring)
   - Choose analytics account: **Default** or create new

### Step 2: Set Up Firestore Database

1. **Navigate to Firestore Database**:
   - In Firebase Console sidebar → **Firestore Database**
   - Click **"Create database"**

2. **Configure Security Rules**:
   - Choose **"Start in production mode"** (we'll configure rules next)
   - Select **Location**: Choose same region as your Supabase (for better performance)

3. **Update Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read/write for authenticated requests
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
       
       // Allow health checks without authentication
       match /health_check/{document} {
         allow read: if true;
       }
     }
   }
   ```

### Step 3: Get Firebase Configuration

1. **Go to Project Settings**:
   - Click the **gear icon** → **Project settings**
   - Scroll to **"Your apps"** section

2. **Add Web App**:
   - Click **"Add app"** → **Web app** (`</>`)
   - App nickname: `deora-plaza-web`
   - **Don't** check "Set up Firebase Hosting"
   - Click **"Register app"**

3. **Copy Configuration**:
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "your-app-id"
   };
   ```

### Step 4: Update Environment Variables

Add these to your `.env.local` file:

```env
# Firebase Backup Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Step 5: Test the Setup

Run the connection test:

```bash
npx tsx test-backup-connection.ts
```

Expected output:
```
🔍 Testing Hybrid Database Connection (Supabase + Firebase)...

Primary (Supabase) URL: https://wjqsqwitgxqypzbaayos.supabase.co
Backup (Firebase) Project: your-project-id

✅ Primary Supabase database connection successful
✅ Firebase backup database connection successful

🔧 Sync Engine Status:
- Hybrid mode active (Supabase primary + Firebase backup)
- Health monitoring enabled for failover
- Real-time sync with automatic failover
```

## 🔄 How It Works

### Normal Operation
- All operations use **Supabase** (primary database)
- Firebase stays in sync through background processes
- Health checks monitor both databases

### Failover Scenario
1. **Supabase becomes unavailable**
2. **Sync engine detects failure** (health check fails)
3. **Automatic failover to Firebase**
4. **Operations continue** with Firebase as active database
5. **Background sync** queues changes for when Supabase returns

### Recovery
1. **Supabase comes back online**
2. **Health check passes**
3. **Sync queued changes** from Firebase to Supabase
4. **Switch back to Supabase** as primary

## 🛠️ Data Synchronization

The system automatically handles:

### Real-time Sync
- **Supabase changes** → Firebase (background sync)
- **Firebase changes** → Supabase (when primary is back)

### Data Mapping
- **PostgreSQL tables** ↔ **Firestore collections**
- **Rows** ↔ **Documents**
- **Columns** ↔ **Fields**
- **Timestamps** automatically converted

### Conflict Resolution
- **Last-write-wins** strategy
- **Timestamp-based** conflict resolution
- **Manual resolution** for critical conflicts

## 🔍 Monitoring & Debugging

### Check System Status
```bash
# Test connections
npx tsx test-backup-connection.ts

# Check sync engine status (in browser console)
console.log(window.syncEngine?.getServerStatus())
```

### Firebase Console Monitoring
1. **Firestore Database** → View collections and documents
2. **Usage** → Monitor read/write operations
3. **Rules** → Check security rule matches

### Logs
- **Browser Console**: Sync engine status and failover events
- **Firebase Console**: Database operations and errors
- **Supabase Dashboard**: Primary database metrics

## 🚨 Troubleshooting

### Common Issues

**Firebase not connecting:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID
echo $NEXT_PUBLIC_FIREBASE_API_KEY
```

**Security rules blocking access:**
- Update Firestore rules to allow your operations
- Check Firebase Console → Firestore → Rules

**Sync not working:**
- Verify both databases are accessible
- Check browser console for sync engine errors
- Restart development server

### Emergency Procedures

**If Supabase is down:**
1. System automatically fails over to Firebase
2. Continue operations normally
3. Monitor Firebase Console for activity

**If Firebase is down:**
1. System continues with Supabase only
2. No backup until Firebase is restored
3. Sync will resume automatically when Firebase returns

## 📊 Performance Considerations

### Costs
- **Firebase**: Pay per read/write operation
- **Supabase**: Fixed pricing with usage limits
- **Optimization**: Minimize unnecessary sync operations

### Latency
- **Same region**: ~10-50ms additional latency during failover
- **Cross-region**: ~100-300ms additional latency
- **Optimization**: Choose Firebase region close to Supabase

### Scaling
- **Firebase**: Auto-scales with usage
- **Supabase**: May need plan upgrades
- **Monitoring**: Watch usage metrics in both consoles

## 🔐 Security Best Practices

### Firebase Security Rules
```javascript
// Production-ready rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restrict access to authenticated users only
    match /{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.token.email_verified == true;
    }
    
    // Health check endpoint
    match /health_check/{document} {
      allow read: if true;
      allow write: if false; // Read-only for health checks
    }
  }
}
```

### Environment Security
- **Never commit** `.env.local` to Git
- **Use different projects** for development/production
- **Rotate API keys** regularly
- **Monitor access logs** in Firebase Console

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Firestore database configured
- [ ] Security rules updated
- [ ] Environment variables added
- [ ] Connection test passes
- [ ] Sync engine shows hybrid mode
- [ ] Failover test successful
- [ ] Recovery test successful

## 🎉 You're All Set!

Your DEORA Plaza system now has enterprise-grade database redundancy with automatic failover between Supabase and Firebase. The system will seamlessly handle database outages and ensure zero-downtime operations.

For support or questions, check the troubleshooting section or review the sync engine logs in your browser console.