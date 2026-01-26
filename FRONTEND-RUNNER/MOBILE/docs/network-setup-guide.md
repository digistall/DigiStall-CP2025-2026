# Network Setup Guide - Mobile Login from Any WiFi

## 🎯 Overview
Your app now supports automatic server discovery across different WiFi networks. However, you need to ensure your backend server is accessible from your mobile device.

## 🔧 Setup Instructions

### Step 1: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address under your active network interface.

### Step 2: Update Server List
Edit `config/networkConfig.js` and add your IP addresses to the `SERVERS` array:

```javascript
SERVERS: [
  'http://YOUR_IP_HERE:3001',  // Replace with your actual IP
  'http://192.168.8.38:3001',  // Current IP
  'http://192.168.1.100:3001', // Common router range
  // ... other servers
],
```

### Step 3: Backend Server Setup
Ensure your backend server is running and accepts connections from any IP:

```javascript
// In your backend server (typically app.js or server.js)
app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on port 3001, accessible from any IP');
});
```

### Step 4: Firewall Configuration

**Windows Firewall:**
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change Settings" → "Allow another app"
4. Browse and select your Node.js executable
5. Check both "Private" and "Public" networks

**Router Configuration:**
- Ensure devices can communicate with each other on your network
- Some routers have "AP Isolation" or "Client Isolation" - disable this

## 🌐 Supported Network Types

The app will automatically work on:
- ✅ Home WiFi networks
- ✅ Office WiFi networks  
- ✅ Mobile hotspots
- ✅ Public WiFi (if server is accessible)

## 🔍 Troubleshooting

### Server Not Found
1. Check if backend server is running: `node server.js` or `npm start`
2. Verify your IP address hasn't changed
3. Test connectivity: `ping YOUR_IP_ADDRESS` from mobile device
4. Check firewall settings

### Connection Timeout
1. Ensure mobile and computer are on same network
2. Try connecting to server from mobile browser: `http://YOUR_IP:3001/api/health`
3. Check router settings for device communication

### Different WiFi Networks
1. Add your new network's IP to the `SERVERS` array
2. The app will automatically discover and connect to available servers

## 📱 How It Works

1. **Server Discovery**: App tests multiple server endpoints
2. **Automatic Selection**: First working server is used
3. **Failover**: If current server fails, app finds another
4. **Network Agnostic**: Works across different WiFi networks

## 🚀 Production Deployment

For production, consider:
- Deploy backend to cloud service (Heroku, Vercel, AWS)
- Add HTTPS endpoints to server list
- Use environment variables for server configuration

## 📞 Support

If you're still having connection issues:
1. Check the app logs in Expo console
2. Verify network configuration
3. Test backend endpoints manually
4. Contact support with error logs