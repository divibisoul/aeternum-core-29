/**
 * Canonical JSON compatible with Go encoding/json for SOUL Mesh HMAC signing.
 * The caller supplies the protocol-defined outer field order; every nested
 * object's keys are serialized lexicographically, not via JS object enumeration.
 */
export function canonicalOrderedJson(entries) {
  const fields = entries
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${JSON.stringify(key)}:${canonicalValue(value)}`);
  return `{${fields.join(',')}}`;
}

function canonicalValue(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return `[${value.map((item) => item === undefined ? 'null' : canonicalValue(item)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const fields = Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalValue(value[key])}`);
    return `{${fields.join(',')}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new TypeError('Unsupported value in canonical Mesh JSON');
  return encoded;
}
