# API Keys Documentation

## Overview

Gispal provides a secure API key system for programmatic access to the platform. API keys allow you to authenticate requests without using session cookies.

## Authentication

All API requests must include your API key in the `x-api-key` header:

```bash
curl -H "x-api-key: gispal_your_api_key_here" https://api.gispal.com/v1/endpoint
```

## API Key Format

API keys follow this format:
- Prefix: `gispal_`
- Length: 36-60 characters
- Example: `gispal_AbCdEf1234567890...`

## Scopes

API keys can have different scopes that control what endpoints they can access:

- `audio:ingest` - Upload and ingest audio files
- `audio:mix` - Mix audio with jingles
- `audiomack:download` - Download from Audiomack
- `workflow:run` - Execute workflows
- `project:read` - Read project data
- `project:write` - Write project data

## Rate Limiting

Each API key has rate limits:
- **Per minute**: Default 60 requests
- **Per day**: Default 5000 requests

When rate limits are exceeded, you'll receive a `429 Too Many Requests` response with headers:
- `X-RateLimit-Limit-PerMinute`
- `X-RateLimit-Limit-PerDay`
- `X-RateLimit-Remaining-PerMinute`
- `X-RateLimit-Remaining-PerDay`
- `X-RateLimit-Reset`

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is not valid"
}
```

### 403 Forbidden
```json
{
  "error": "API key revoked",
  "message": "This API key has been revoked"
}
```

```json
{
  "error": "Insufficient permissions",
  "message": "This API key does not have the required scopes: audio:ingest",
  "required": ["audio:ingest"],
  "granted": ["project:read"]
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "You have exceeded your rate limit. Please try again later.",
  "resetAt": "2024-01-01T12:00:00Z",
  "remainingPerMinute": 0,
  "remainingPerDay": 100
}
```

## Endpoints Requiring Scopes

### Audio Endpoints

- `POST /api/audio/ingest` - Requires `audio:ingest`
- `POST /api/audio/process` - Requires `audio:ingest`
- `POST /api/audio/mix` - Requires `audio:mix`

### Audiomack Endpoints

- `POST /api/audio/audiomack-ingest` - Requires `audiomack:download`

### Project Endpoints

- `GET /api/projects` - Requires `project:read`
- `POST /api/projects` - Requires `project:write`
- `PATCH /api/projects/:id` - Requires `project:write`
- `DELETE /api/projects/:id` - Requires `project:write`

## Usage Example

```bash
# Create an audio mix
curl -X POST https://api.gispal.com/api/audio/mix \
  -H "x-api-key: gispal_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "audioId": "audio-123",
    "jingleId": "jingle-456",
    "position": "start"
  }'
```

## Best Practices

1. **Store keys securely**: Never commit API keys to version control
2. **Rotate regularly**: Rotate keys periodically for security
3. **Use minimal scopes**: Only grant the scopes your application needs
4. **Monitor usage**: Check usage statistics regularly
5. **Handle errors**: Implement proper error handling for 401, 403, and 429 responses

## Key Management

API keys can be managed through:
- Dashboard UI: `/dashboard/api-keys`
- API endpoints: `/api/keys`

See the API reference for key management endpoints.

