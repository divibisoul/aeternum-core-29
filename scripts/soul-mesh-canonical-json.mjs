/**
 * Sort nested JSON object keys recursively for cross-language HMAC canonical
 * envelopes. Arrays retain order; the caller owns top-level protocol field order.
 */
export function stableJsonValue(value) {
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (value !== null && typeof value === 'object') {
    const normalized = {};
    for (const key of Object.keys(value).sort()) {
      normalized[key] = stableJsonValue(value[key]);
    }
    return normalized;
  }
  return value;
}
