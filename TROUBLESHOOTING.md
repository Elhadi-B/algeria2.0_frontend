# Troubleshooting Guide

## Common Issues

### White Screen or API Errors

If you see a white screen or errors when accessing `/admin/teams` or other pages:

#### 1. Check Backend Server
- **Make sure the Django backend is running** at `http://localhost:8000`
- Test by visiting `http://localhost:8000/api/admin/teams/` in your browser (if logged in)

#### 2. CORS Errors
If you see errors like:
- `Access to fetch at 'http://localhost:8000/api/...' from origin 'http://localhost:8080' has been blocked by CORS policy`
- `Network error: Unable to connect to...`

**Solution**: Make sure your Django backend has CORS configured to allow requests from `http://localhost:8080`

Add to your Django `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
]

CORS_ALLOW_CREDENTIALS = True
```

#### 3. Authentication Errors
If you see `401 Unauthorized` or `403 Forbidden`:
- Make sure you're logged in via `/admin/login`
- Check that the session cookie is being sent (check browser DevTools > Application > Cookies)
- Try logging out and logging back in

#### 4. Network Connection Refused
If you see `Network error: Unable to connect to...`:
- Backend server is not running
- Backend is running on a different port
- Firewall blocking the connection

#### 5. Check Browser Console
Open browser DevTools (F12) and check:
- **Console tab**: For JavaScript errors
- **Network tab**: For failed API requests (check status code and response)

## Testing the API

### Test Admin Login
```bash
curl -X POST http://localhost:8000/api/admin/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt \
  -v
```

### Test Teams List (after login)
```bash
curl -X GET http://localhost:8000/api/admin/teams/ \
  -b cookies.txt \
  -v
```

## Frontend API Configuration

The API base URL is configured in `src/lib/api.ts`:
```typescript
const API_BASE_URL = "http://localhost:8000/api";
```

If your backend is on a different port or domain, update this constant.

## Getting More Information

1. **Browser Console**: Check for detailed error messages
2. **Network Tab**: See the exact request/response details
3. **Backend Logs**: Check Django server console for errors

