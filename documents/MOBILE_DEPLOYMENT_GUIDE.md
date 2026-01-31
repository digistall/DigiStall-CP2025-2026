# Mobile App Deployment Guide

## Problem
Your mobile app shows "Server Unavailable" even though the backend is running because:
1. The app is using cached old code that points to localhost
2. The updated network configuration isn't loaded yet

## Solution

### Option 1: Testing with Expo Go (Development)

#### Step 1: Clear the cache and restart Metro
```powershell
cd Frontend/Mobile

# Stop any running Metro bundler (Ctrl+C)

# Clear all caches
npx expo start -c
```

#### Step 2: Reload the app on your phone
- Shake your phone to open the Expo menu
- Tap "Reload"
- OR close the Expo Go app completely and reopen it
- Scan the QR code again

### Option 2: Build Production APK (Recommended)

The production APK will have the correct server URL baked in.

#### Prerequisites
```powershell
cd Frontend/Mobile

# Install EAS CLI (if not already installed)
npm install -g @expo/eas-cli

# Login to Expo
eas login
```

#### Build Android APK
```powershell
# Build for Android
eas build --platform android --profile preview

# This will:
# 1. Upload your code to Expo servers
# 2. Build the APK with the correct configuration
# 3. Give you a download link when complete (takes ~10-15 minutes)
```

#### Install on Phone
1. Download the APK from the link provided by EAS
2. Transfer to your phone (via email/drive/USB)
3. Enable "Install from unknown sources" in Android settings
4. Install the APK
5. The app will now connect to: `http://68.183.154.125:5001`

### Option 3: Local Build (Faster but requires Android Studio)

```powershell
cd Frontend/Mobile

# Generate native Android project
npx expo prebuild

# Build release APK
npx expo run:android --variant release

# APK will be in: android/app/build/outputs/apk/release/
```

## How It Works

### Server Discovery
The app tries servers in this order (from `networkConfig.js`):

1. ✅ `http://68.183.154.125:5001` ← Production Mobile API
2. ✅ `http://68.183.154.125:5000` ← Production Web API (fallback)
3. ❌ `http://192.168.1.101:5001` ← Your local development IP
4. ❌ `http://localhost:5001` ← Only works in emulator

When you **build a production APK**, the app tests each server and connects to the first working one (which will be the DigitalOcean server).

### Backend Status
Your backend is confirmed running:
- ✅ Backend-Mobile: `http://68.183.154.125:5001` (port 5001)
- ✅ Backend-Web: `http://68.183.154.125:5000` (port 5000)
- ✅ Database: Connected and healthy

## Troubleshooting

### "Server Unavailable" persists
```powershell
# 1. Verify backend is actually running
ssh root@68.183.154.125
docker ps
# You should see: digistall-backend-mobile (running)

# 2. Check backend logs
docker logs digistall-backend-mobile --tail 50

# 3. Test the health endpoint manually
curl http://68.183.154.125:5001/api/mobile/health

# 4. Clear Expo cache completely
cd Frontend/Mobile
npx expo start -c --clear
```

### Build fails with EAS
```powershell
# Check if you're logged in
eas whoami

# Check your EAS project configuration
eas build:configure
```

## Current Configuration

### Mobile App (`Frontend/Mobile/config/networkConfig.js`)
- ✅ Production servers are FIRST in the list
- ✅ Automatic server discovery enabled
- ✅ Health check on `/api/mobile/health`

### Docker Backend (`docker-compose.yml`)
- ✅ backend-mobile runs on port 5001
- ✅ backend-web runs on port 5000
- ✅ Both exposed to external traffic

### Database
- ✅ AWS RDS MySQL
- ✅ Host: `db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com`
- ✅ Database: `naga_stall_digitalocean`

## Quick Commands

### Restart backend (if needed)
```bash
ssh root@68.183.154.125
cd /opt/digistall
docker-compose restart backend-mobile
docker logs digistall-backend-mobile --tail 50
```

### Check what IP your phone sees
```powershell
# On your computer, find your local IP
ipconfig
# Look for "IPv4 Address" under your Wi-Fi adapter

# Add it to networkConfig.js if needed (for local dev only)
```

## Recommended Workflow

**For Final Deployment:**
1. Build production APK with EAS: `eas build --platform android --profile preview`
2. Wait ~10-15 minutes for build
3. Download and install APK on test device
4. App will automatically connect to DigitalOcean server

**For Development Testing:**
1. Make sure you're on the same Wi-Fi as your backend
2. Run `npx expo start -c` to clear cache
3. Scan QR code with Expo Go
4. App will try DigitalOcean first, then fallback to local network
