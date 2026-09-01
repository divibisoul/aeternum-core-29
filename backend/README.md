# N01 Backend Integration

N01 remains the neural runtime. This backend contract adds an optional bridge to N07 without removing existing capabilities.

Environment:
- `N07_BACKEND_URL`: base URL for the N07 unified backend.
- `N07_APP_TOKEN`: Bearer token expected by N07.
- `SOUL_MESH_HMAC_SECRET`: Mesh HMAC secret when using direct Mesh transport.

The bridge must call N07 only when configured; local N01 functionality remains the default fallback.
