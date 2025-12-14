# Grok Image Generation API

## Overview
This API provides automated image generation using Grok's AI, with a **persistent WebDriver** that stays alive for fast generation.

## How It Works

### 1. Persistent Driver
- **WebDriver starts automatically** when Django starts
- Stays **logged into Grok** and ready on the Imagine page
- No need to restart browser or re-login for each request
- Much faster: ~40 seconds per generation (vs 60+ seconds with cold start)

### 2. API Endpoint

**URL**: `POST /api/imagegen/generate/`

**Request**:
```json
{
  "prompt": "A futuristic cyberpunk city at sunset with flying cars",
  "num_images": 4,
  "return_base64": true
}
```

**Response**:
```json
{
  "success": true,
  "prompt": "A futuristic cyberpunk city at sunset with flying cars",
  "images": [
    {
      "filename": "image_1.png",
      "base64": "iVBORw0KGgoAAAANS...",
      "url": "https://pbs.twimg.com/..."
    }
  ],
  "count": 4,
  "output_dir": "media/generated_images/abc123"
}
```

## Installation

### 1. Install Dependencies
```powershell
pip install undetected-chromedriver selenium requests
```

### 2. Chrome/Chromium Required
Make sure Chrome or Chromium is installed on your system.

### 3. Update Cookies
Edit `imagegen/grok_service.py` and update the `GROK_COOKIES` array with your fresh Grok cookies when they expire.

## Usage

### Start Django Server
```powershell
# Set headless mode (optional)
$env:GROK_HEADLESS="true"  # or "false" to see browser

# Start server
python manage.py runserver
```

**Watch for startup logs**:
```
🚀 ImageGen app ready - starting persistent Grok driver...
✓ Driver initialized successfully
✓ Added 11/11 cookies
✓ Session verified, ready on Imagine page
✅ Grok driver ready for image generation!
```

### Make API Request
```powershell
# PowerShell
$body = @{
    prompt = "A dragon flying over mountains at sunset"
    num_images = 4
    return_base64 = $true
} | ConvertTo-Json

Invoke-WebRequest `
    -Uri "http://127.0.0.1:8000/api/imagegen/generate/" `
    -Method Post `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

## Configuration

### Environment Variables
- `GROK_HEADLESS` - Set to `false` to see browser window (default: `true`)
- `RUN_MAIN` - Set by Django reloader (don't modify)

### Update Cookies
When Grok session expires, get fresh cookies and update `GROK_COOKIES` in `imagegen/grok_service.py`:
1. Open DevTools in your browser (F12)
2. Go to Application > Cookies > grok.com
3. Export all cookies
4. Replace the `GROK_COOKIES` array

## Troubleshooting

### "No images were generated"
- Check if driver initialized successfully on startup
- Look for error screenshots in `media/generated_images/*/`
- Try setting `GROK_HEADLESS=false` to debug visually
- Verify cookies are still valid

### Driver not starting
- Make sure Chrome/Chromium is installed
- Check terminal for error logs
- Try manually: `python -c "from imagegen import grok_service; grok_service.initialize_driver(headless=False)"`

### Session expired
- Update cookies in `GROK_COOKIES` array
- Restart Django server

## Architecture

```
Django Startup
    ↓
ImagegenConfig.ready()
    ↓
Background thread starts
    ↓
PersistentGrokDriver.setup_driver()
    ↓
Chrome launches (headless)
    ↓
Cookies loaded
    ↓
Navigate to grok.com/imagine
    ↓
✅ Ready for requests
    ↓
API Request → generate_grok_images()
    ↓
Use existing driver (no restart!)
    ↓
Submit prompt → Wait 40s → Download images
    ↓
Return JSON response
```

## Performance

- **First request**: ~40 seconds
- **Subsequent requests**: ~40 seconds
- **Driver restart**: ~60 seconds (only if crashed)
- **Multiple concurrent requests**: Use queue/Celery (not yet implemented)

## Future Improvements

- [ ] Add request queue for concurrent requests
- [ ] Implement Celery for async processing
- [ ] Add WebSocket for progress updates
- [ ] Auto-refresh cookies before expiry
- [ ] Health check endpoint
- [ ] Image cache/deduplication
