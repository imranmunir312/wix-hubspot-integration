export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export function traverseJSON(obj: JsonValue): JsonValue {
  if (typeof obj === 'string') {
    const trimmedValue = obj.trim();

    if (isJsonString(trimmedValue)) {
      try {
        return traverseJSON(JSON.parse(trimmedValue) as JsonValue);
      } catch {
        return obj;
      }
    }
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((value) => traverseJSON(value));
  }

  const parsedObject: { [key: string]: JsonValue } = {};

  for (const [key, value] of Object.entries(obj)) {
    parsedObject[key] = traverseJSON(value);
  }

  return parsedObject;
}

function isJsonString(value: string): boolean {
  return (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  );
}
