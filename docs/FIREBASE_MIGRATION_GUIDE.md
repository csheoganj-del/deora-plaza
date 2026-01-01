# Firebase Migration Guide for Deora Plaza Management System

## 📋 Overview
This guide will help you complete the migration from SQLite + Prisma to Firebase (Firestore + Firebase Auth).

---

## 🔥 Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Add project"
   - Project name: `Deora Plaza`
   - Enable/Disable Google Analytics (your choice)
   - Click "Create project"

3. **Enable Firestore Database**
   - In Firebase Console, go to "Build" → "Firestore Database"
   - Click "Create database"
   - Choose "Start in production mode" (we'll set rules later)
   - Select location: `asia-south1` (Mumbai) or closest to you
   - Click "Enable"

4. **Enable Authentication**
   - Go to "Build" → "Authentication"
   - Click "Get started"
   - Enable "Email/Password" sign-in method
   - Click "Save"

5. **Enable Storage** (for future file uploads)
   - Go to "Build" → "Storage"
   - Click "Get started"
   - Use default security rules
   - Click "Done"

---

## 🔑 Step 2: Get Firebase Configuration

1. **Get Web App Config**
   - In Firebase Console, click the gear icon (⚙️) → "Project settings"
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to add a web app
   - App nickname: `Deora Plaza Web`
   - Don't enable Firebase Hosting (we'll use Next.js)
   - Click "Register app"
   
2. **Copy Firebase Config**
   - You'll see a `firebaseConfig` object
   - Copy the values for:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`

3. **Update .env File**
   - Open `.env` file in your project
   - Add these lines (replace with your actual values):

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 🔐 Step 3: Get Service Account Key (for Admin SDK)

1. **Generate Service Account Key**
   - In Firebase Console → Project Settings
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Click "Generate key" (a JSON file will download)

2. **Add to Environment Variables**
   - Open the downloaded JSON file
   - Copy the entire JSON content
   - In your `.env` file, add:

```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**⚠️ IMPORTANT**: Keep this key secret! Never commit it to Git.

---

## 📊 Step 4: Firestore Data Structure

Firebase uses NoSQL (document-based) instead of SQL. Here's how we'll structure the data:

### **Collections:**

```
firestore/
├── users/
│   └── {userId}/
│       ├── username: string
│       ├── role: string
│       ├── businessUnit: string
│       ├── profile: object
│       ├── permissions: array
│       ├── isActive: boolean
│       └── createdAt: timestamp
│
├── customers/
│   └── {customerId}/
│       ├── mobileNumber: string
│       ├── name: string
│       ├── email: string
│       ├── visitCount: number
│       ├── totalSpent: number
│       ├── discountTier: string
│       └── lastVisit: timestamp
│
├── tables/
│   └── {tableId}/
│       ├── tableNumber: string
│       ├── businessUnit: string
│       ├── capacity: number
│       ├── status: string
│       └── customerCount: number
│
├── orders/
│   └── {orderId}/
│       ├── orderNumber: string
│       ├── type: string
│       ├── businessUnit: string
│       ├── tableId: string
│       ├── customerMobile: string
│       ├── status: string
│       ├── totalAmount: number
│       ├── items: array
│       └── createdAt: timestamp
│
├── menuItems/
│   └── {itemId}/
│       ├── name: string
│       ├── description: string
│       ├── price: number
│       ├── category: string
│       ├── businessUnit: string
│       └── isAvailable: boolean
│
├── bookings/
│   └── {bookingId}/
│       ├── customerMobile: string
│       ├── type: string (hotel/garden)
│       ├── startDate: timestamp
│       ├── endDate: timestamp
│       ├── status: string
│       ├── totalAmount: number
│       ├── eventType: string (for garden)
│       ├── guestCount: number
│       └── advancePayment: number
│
├── rooms/
│   └── {roomId}/
│       ├── roomNumber: string
│       ├── type: string
│       ├── pricePerNight: number
│       └── status: string
│
└── bills/
    └── {billId}/
        ├── billNumber: string
        ├── orderId: string
        ├── businessUnit: string
        ├── subtotal: number
        ├── gstAmount: number
        ├── grandTotal: number
        └── paymentStatus: string
```

---

## 🔒 Step 5: Set Firestore Security Rules

1. **Go to Firestore Database**
   - Click "Rules" tab
   - Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
    
    function isAdmin() {
      return hasRole('super_admin') || hasRole('owner');
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Customers collection
    match /customers/{customerId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // Tables collection
    match /tables/{tableId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isAdmin();
    }
    
    // Menu items
    match /menuItems/{itemId} {
      allow read: if true; // Public read
      allow write: if isAdmin();
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // Rooms
    match /rooms/{roomId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Bills
    match /bills/{billId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
  }
}
```

2. **Click "Publish"**

---

## 👥 Step 6: Create Initial Users in Firebase Auth

Since we're migrating from the database, you'll need to manually create users in Firebase Authentication:

1. **Go to Authentication**
   - Click "Users" tab
   - Click "Add user"

2. **Create Super Admin**
   - Email: `kalpeshdeora@deorapalza.com` (or any email)
   - Password: `Kalpesh!1006`
   - Click "Add user"
   - Copy the User UID

3. **Add User Document in Firestore**
   - Go to Firestore Database
   - Click "Start collection"
   - Collection ID: `users`
   - Document ID: (paste the User UID from step 2)
   - Add fields:
     - `username` (string): `kalpeshdeora`
     - `role` (string): `super_admin`
     - `businessUnit` (string): `all`
     - `isActive` (boolean): `true`
     - `createdAt` (timestamp): (click "Set to current time")

4. **Repeat for Other Users**
   - Create users for each role you need
   - Always create the user in Auth first, then add the document in Firestore

---

## 🧪 Step 7: Test Firebase Connection

After completing the above steps:

1. **Restart the dev server**
   ```bash
   npm run dev
   ```

2. **Check browser console**
   - Open http://localhost:3001
   - Open browser DevTools (F12)
   - You should see Firebase initialized without errors

---

## 📝 Next Steps

Once you've completed the above steps, let me know and I'll:

1. ✅ Migrate all authentication logic to Firebase Auth
2. ✅ Rewrite all database queries to use Firestore
3. ✅ Update all components to work with Firebase
4. ✅ Add real-time listeners for live updates
5. ✅ Set up data migration scripts

---

## 🆘 Troubleshooting

### **Error: "Firebase: Error (auth/invalid-api-key)"**
- Check that your API key in `.env` is correct
- Make sure you're using `NEXT_PUBLIC_` prefix

### **Error: "Missing or insufficient permissions"**
- Check Firestore security rules
- Make sure you're signed in
- Verify user document exists in Firestore

### **Error: "Firebase app named '[DEFAULT]' already exists"**
- This is normal during development
- The code handles this automatically

---

## 📞 Support

If you encounter any issues:
1. Check the Firebase Console for error logs
2. Check browser console for client-side errors
3. Check terminal for server-side errors
4. Let me know the specific error message

---

**Ready to proceed? Complete Steps 1-6 above, then let me know when you're done!** 🚀
