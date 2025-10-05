# Quick Setup Guide

## Step-by-Step Instructions

### 1. Create Firebase Project

1. Visit https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name (e.g., "phone-imei-inventory")
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Google Authentication

1. In your Firebase project, go to **Build** > **Authentication**
2. Click "Get started"
3. Click on **Sign-in method** tab
4. Click on **Google**
5. Toggle "Enable"
6. Select support email
7. Click "Save"

### 3. Create Firestore Database

1. Go to **Build** > **Firestore Database**
2. Click "Create database"
3. Select "Start in production mode"
4. Choose your location (closest to your users)
5. Click "Enable"

### 4. Set Firestore Security Rules

1. In Firestore Database, click on **Rules** tab
2. Replace the existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /phones/{phoneId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click "Publish"

### 5. Get Firebase Configuration

1. Go to **Project Overview** (gear icon) > **Project settings**
2. Scroll down to "Your apps" section
3. Click on web icon `</>`
4. Register app with nickname (e.g., "IMEI Inventory Web")
5. Copy the `firebaseConfig` object

### 6. Update app.js

Open `app.js` and replace lines 2-8 with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};
```

### 7. Create App Icons

Create two icon files or use online tools:

**Option A: Use Online Icon Generator**
- Visit https://realfavicongenerator.net/
- Upload a logo/image
- Download and place `icon-192.png` and `icon-512.png` in the root folder

**Option B: Create Simple Icons**
- Create 192x192px PNG (name it `icon-192.png`)
- Create 512x512px PNG (name it `icon-512.png`)
- Use any image editor or online tool

### 8. Test Locally

1. Install a local server (if you don't have one):
   ```bash
   npm install -g http-server
   ```

2. Run in your project directory:
   ```bash
   http-server -p 8080
   ```

3. Open browser: `http://localhost:8080`

### 9. Deploy to Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login:
   ```bash
   firebase login
   ```

3. Initialize (select your project):
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Use current directory as public directory: **.**
   - Configure as single-page app: **Yes**
   - Don't overwrite existing files: **No**

4. Deploy:
   ```bash
   firebase deploy
   ```

5. Your app will be live at: `https://your-project-id.web.app`

## Authorized Domains

If you get authentication errors, add your domain:

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Add your domain (e.g., `your-project-id.web.app`)
3. For localhost testing, `localhost` is already authorized

## Install as PWA

Once deployed:

1. **On Android**: 
   - Open in Chrome
   - Tap menu (3 dots)
   - Select "Install app" or "Add to Home screen"

2. **On iOS**: 
   - Open in Safari
   - Tap Share button
   - Select "Add to Home Screen"

3. **On Desktop Chrome**:
   - Click install icon in address bar
   - Or menu > "Install Phone IMEI Inventory"

## Troubleshooting

### Firebase not defined error
- Check that Firebase SDK scripts are loading in `index.html`
- Verify internet connection

### Authentication fails
- Verify Google Sign-in is enabled in Firebase Console
- Check authorized domains in Authentication settings

### Data not saving
- Check Firestore security rules
- Verify user is authenticated
- Open browser console for errors

### PWA not installing
- Ensure you're using HTTPS (localhost is OK for testing)
- Check that manifest.json and service-worker.js are accessible
- Verify icon files exist

## Features Checklist

- ✅ Google Sign-in authentication
- ✅ Add phone (model + IMEI)
- ✅ Edit phone details
- ✅ Delete phone with confirmation
- ✅ Mark as sold
- ✅ Search by IMEI or model
- ✅ Stock statistics display
- ✅ Mobile responsive design
- ✅ PWA installable
- ✅ Offline support
- ✅ Real-time sync

## Need Help?

- Firebase Docs: https://firebase.google.com/docs
- PWA Guide: https://web.dev/progressive-web-apps/
- Firestore Guide: https://firebase.google.com/docs/firestore

Enjoy your Phone IMEI Inventory app! 📱



