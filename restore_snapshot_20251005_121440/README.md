# Phone IMEI Inventory Management System

A Progressive Web App (PWA) for managing phone IMEI inventory with Firebase backend and Google authentication.

## Features

- 📱 **Add/Edit/Delete Phones**: Manage phone inventory with model and IMEI numbers
- 🔍 **Search**: Search by IMEI number or phone model
- 📊 **Statistics**: View total stock, sold items, and available inventory
- ✅ **Mark as Sold**: Track which phones have been sold
- 🔐 **Google Sign-In**: Secure authentication with Google
- 📱 **Mobile Responsive**: Optimized for mobile devices
- 💾 **Offline Support**: PWA capabilities for offline access
- ⚡ **Real-time Updates**: Automatic sync with Firebase

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Authentication** > **Sign-in method** > **Google**
4. Enable **Firestore Database** (start in production mode)
5. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Click the web icon (</>)
   - Copy the Firebase configuration object

### 2. Configure Firebase in the App

Open `app.js` and replace the Firebase configuration with your own:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 3. Firestore Security Rules

Set up Firestore security rules in Firebase Console > Firestore Database > Rules:

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

### 4. Add App Icons

Create two PNG icons for your PWA:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

Place them in the root directory alongside `index.html`.

### 5. Deploy

You can deploy this app using:

#### Option A: Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init hosting

# Deploy
firebase deploy
```

#### Option B: Any Static Hosting

Upload all files to any static hosting service like:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

### 6. HTTPS Requirement

PWAs require HTTPS. Most hosting providers (Firebase, Netlify, Vercel) automatically provide HTTPS.

## Usage

1. **Sign In**: Click "Sign in with Google" to authenticate
2. **Add Phone**: Click the "Add Phone" button to add a new phone with model and IMEI
3. **Search**: Use the search bar to find phones by model or IMEI
4. **Edit**: Click the edit icon to modify phone details
5. **Mark as Sold**: Click the cart icon to mark a phone as sold
6. **Delete**: Click the delete icon to remove a phone (with confirmation)
7. **View Stats**: Check the dashboard for inventory statistics

## File Structure

```
PhoneIMEI/
├── index.html          # Main HTML file
├── styles.css          # Styles and responsive design
├── app.js             # JavaScript logic and Firebase integration
├── manifest.json      # PWA manifest
├── service-worker.js  # Service worker for offline support
├── icon-192.png       # App icon (192x192)
├── icon-512.png       # App icon (512x512)
└── README.md          # This file
```

## Technologies Used

- **HTML5**: Structure
- **CSS3**: Styling with Material Design principles
- **JavaScript**: Application logic
- **Firebase Authentication**: Google Sign-in
- **Cloud Firestore**: Database
- **PWA**: Progressive Web App features
- **Material Icons**: UI icons

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- User authentication required
- Data isolated per user
- Firestore security rules enforce access control
- HTTPS required for production

## Support

For issues or questions, please check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [PWA Guide](https://web.dev/progressive-web-apps/)

## License

MIT License - feel free to use and modify for your needs.



