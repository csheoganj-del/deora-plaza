# Google Maps Integration Setup Guide

## Overview
The DEORA Plaza location tracking system now supports **Google Maps** integration for real-time staff location visualization with actual map tiles, streets, and satellite imagery.

## Features

### 🗺️ Google Maps Integration
- **Real map tiles** with streets, buildings, and landmarks
- **Satellite view** option for aerial imagery
- **Interactive markers** with custom colors per role
- **Info windows** with detailed staff information
- **Accuracy circles** for GPS-tracked locations
- **Auto-zoom** to fit all staff locations
- **Street view** support
- **Real-time updates** with auto-refresh

### 📍 Location Features
- **Role-based markers**: Different colors for waiters, kitchen, managers, etc.
- **Online/Offline status**: Visual indicators for staff availability
- **Location accuracy**: GPS, IP, or manual location sources
- **Click for details**: Interactive markers with full staff info
- **Center on location**: Quick navigation to your current position
- **Fullscreen mode**: Expand map for better visibility

## Setup Instructions

### Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API** (optional, for enhanced features)
   - **Geocoding API** (optional, for address lookup)

4. Create API credentials:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **API Key**
   - Copy your API key

5. Restrict your API key (recommended):
   - Click on your API key
   - Under **Application restrictions**, select **HTTP referrers**
   - Add your domains:
     - `localhost:3000` (for development)
     - `yourdomain.com` (for production)
   - Under **API restrictions**, select **Restrict key**
   - Choose the APIs you enabled above

### Step 2: Configure Environment Variables

Add your Google Maps API key to your `.env` file:

```bash
# Google Maps Configuration
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Important**: The `NEXT_PUBLIC_` prefix is required for client-side access.

### Step 3: Verify Installation

The required package is already installed:
```bash
@googlemaps/js-api-loader
```

If you need to reinstall:
```bash
npm install @googlemaps/js-api-loader
```

### Step 4: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Login with admin credentials:
   - Username: `admin`
   - Password: `AdminPass123!`

3. Navigate to **Locations** in the sidebar

4. Toggle between map types using the button:
   - **🗺️ Google Maps** - Full Google Maps with real tiles
   - **📍 Simple Map** - Canvas-based simple visualization

## Usage Guide

### Map Controls

#### Toggle Map Type
- Click the **🗺️ Google Maps** button to switch between Google Maps and simple canvas map
- Google Maps provides real street data and satellite imagery

#### Map View Options
- **Map View**: Standard street map with roads and labels
- **Satellite View**: Aerial/satellite imagery

#### Navigation
- **Pan**: Click and drag the map
- **Zoom**: Use mouse wheel or +/- buttons
- **Center on Me**: Click the navigation button to center on your location
- **Fullscreen**: Expand map to full screen for better visibility

### Staff Markers

#### Marker Colors by Role
- 🍽️ **Blue** - Waiters
- 👨‍🍳 **Red** - Kitchen Staff
- 🍹 **Amber** - Bartenders
- 👔 **Purple** - Managers
- 🏨 **Green** - Reception
- ⭐ **Red** - Super Admin
- 👑 **Purple** - Owner
- **Gray** - Offline staff

#### Marker Information
Click any marker to see:
- Staff name and role
- Business unit
- Online/Offline status
- Location source (GPS/IP/Manual)
- Accuracy (for GPS locations)
- Last seen time
- Exact coordinates

#### Accuracy Circles
- GPS-tracked locations show a **translucent circle** indicating accuracy
- Smaller circles = more accurate location
- Larger circles = less precise location

### Auto-Refresh
- Enable **Auto Refresh** to update locations every 30 seconds
- Green indicator shows when auto-refresh is active
- Manual refresh available anytime with the **Refresh** button

## API Costs & Limits

### Google Maps Pricing
- **$200 free credit** per month (covers ~28,000 map loads)
- After free tier: **$7 per 1,000 map loads**
- Most small to medium businesses stay within free tier

### Cost Optimization Tips
1. **Restrict API key** to your domains only
2. **Enable billing alerts** in Google Cloud Console
3. **Use caching** - Maps are cached by the browser
4. **Limit auto-refresh** - Default is 30 seconds (configurable)
5. **Monitor usage** in Google Cloud Console

### Free Tier Breakdown
- **Maps JavaScript API**: 28,000 loads/month free
- **Places API**: 17,000 requests/month free
- **Geocoding API**: 40,000 requests/month free

## Troubleshooting

### Map Not Loading
1. **Check API key**: Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in `.env`
2. **Verify API is enabled**: Maps JavaScript API must be enabled in Google Cloud
3. **Check browser console**: Look for error messages
4. **Verify domain restrictions**: Ensure your domain is allowed in API key settings

### "This page can't load Google Maps correctly"
- API key is invalid or not configured
- Billing is not enabled in Google Cloud (required even for free tier)
- API restrictions are too strict

### Markers Not Appearing
- Check that users have location data in the database
- Verify location permissions are granted
- Ensure coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)

### Performance Issues
- Reduce auto-refresh interval
- Limit number of visible markers with filters
- Use satellite view sparingly (higher data usage)

## Fallback Options

If Google Maps is not configured or fails to load:
1. System automatically shows error message
2. Toggle to **Simple Map** mode (canvas-based)
3. All functionality works without Google Maps (just without real map tiles)

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive data
3. **Restrict API key** to specific domains
4. **Enable billing alerts** to prevent unexpected charges
5. **Rotate API keys** periodically
6. **Monitor API usage** regularly

## Advanced Features

### Custom Styling
Edit `GoogleLocationMap.tsx` to customize:
- Marker icons and colors
- Info window content
- Map styles (hide POIs, change colors, etc.)
- Accuracy circle appearance

### Additional APIs
Enable these for enhanced features:
- **Directions API**: Show routes between locations
- **Distance Matrix API**: Calculate travel times
- **Geolocation API**: Improve location accuracy
- **Time Zone API**: Handle multi-timezone operations

## Support

For issues or questions:
1. Check Google Maps [documentation](https://developers.google.com/maps/documentation)
2. Review [API pricing](https://mapsplatform.google.com/pricing/)
3. Check [quota limits](https://developers.google.com/maps/documentation/javascript/usage-and-billing)

## Summary

✅ **Installed**: `@googlemaps/js-api-loader` package  
✅ **Created**: `GoogleLocationMap.tsx` component  
✅ **Integrated**: Toggle between Google Maps and simple map  
✅ **Features**: Real-time tracking, role-based markers, info windows  
✅ **Fallback**: Works without API key (simple map mode)  

**Next Step**: Add your Google Maps API key to `.env` and start tracking staff locations on real maps!