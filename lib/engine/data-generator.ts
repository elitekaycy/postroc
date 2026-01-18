import { faker } from '@faker-js/faker';
import type { Field, FieldType } from '@/lib/types/core';

export function generateFieldValue(field: Field): unknown {
  if (field.value !== undefined && field.value !== null && field.value !== '') {
    return field.value;
  }

  // Handle object and array types with children
  if (field.type === 'object' && field.children && field.children.length > 0) {
    const obj: Record<string, unknown> = {};
    for (const child of field.children) {
      if (child.isExported) {
        obj[child.key] = generateFieldValue(child);
      }
    }
    return obj;
  }

  if (field.type === 'array' && field.children && field.children.length > 0) {
    const count = faker.number.int({ min: 1, max: 3 });
    const items: unknown[] = [];
    for (let i = 0; i < count; i++) {
      if (field.children.length === 1 && field.children[0].type !== 'object') {
        // Simple array items
        items.push(generateFieldValue(field.children[0]));
      } else {
        // Array of objects
        const obj: Record<string, unknown> = {};
        for (const child of field.children) {
          if (child.isExported) {
            obj[child.key] = generateFieldValue(child);
          }
        }
        items.push(obj);
      }
    }
    return items;
  }

  return generateValueForType(field.type, field.key);
}

function generateValueForType(type: FieldType, key: string): unknown {
  const keyLower = key.toLowerCase();

  if (keyLower.includes('email')) {
    return faker.internet.email();
  }
  if (keyLower.includes('name') && !keyLower.includes('username')) {
    return faker.person.fullName();
  }
  if (keyLower.includes('username')) {
    return faker.internet.username();
  }
  if (keyLower.includes('phone')) {
    return faker.phone.number();
  }
  if (keyLower.includes('address')) {
    return faker.location.streetAddress();
  }
  if (keyLower.includes('city')) {
    return faker.location.city();
  }
  if (keyLower.includes('country')) {
    return faker.location.country();
  }
  if (keyLower.includes('zip') || keyLower.includes('postal')) {
    return faker.location.zipCode();
  }
  if (keyLower.includes('url') || keyLower.includes('website')) {
    return faker.internet.url();
  }
  if (keyLower.includes('avatar') || keyLower.includes('image')) {
    return faker.image.avatar();
  }
  if (keyLower.includes('date') || keyLower.includes('created') || keyLower.includes('updated')) {
    return faker.date.recent().toISOString();
  }
  if (keyLower.includes('description') || keyLower.includes('bio')) {
    return faker.lorem.paragraph();
  }
  if (keyLower.includes('title')) {
    return faker.lorem.sentence();
  }
  if (keyLower.includes('price') || keyLower.includes('amount') || keyLower.includes('cost')) {
    return parseFloat(faker.commerce.price());
  }
  if (keyLower.includes('id') && type === 'string') {
    return faker.string.uuid();
  }
  if (keyLower.includes('id') && type === 'number') {
    return faker.number.int({ min: 1, max: 10000 });
  }

  switch (type) {
    case 'string':
      return faker.lorem.word();
    case 'number':
      return faker.number.int({ min: 1, max: 1000 });
    case 'boolean':
      return faker.datatype.boolean();
    case 'array':
      return generateArray(keyLower);
    case 'object':
      return {};
    case 'reference':
      return null;
    case 'api-fetch':
      return null;
    default:
      return null;
  }
}

function generateArray(key: string): unknown[] {
  const count = faker.number.int({ min: 1, max: 5 });
  const items: unknown[] = [];

  for (let i = 0; i < count; i++) {
    if (key.includes('tag')) {
      items.push(faker.lorem.word());
    } else if (key.includes('email')) {
      items.push(faker.internet.email());
    } else if (key.includes('name')) {
      items.push(faker.person.fullName());
    } else if (key.includes('id')) {
      items.push(faker.string.uuid());
    } else {
      items.push(faker.lorem.word());
    }
  }

  return items;
}

export function setSeed(seed: number): void {
  faker.seed(seed);
}

export function resetSeed(): void {
  faker.seed();
}

export function generateMultiple(field: Field, count: number): unknown[] {
  const results: unknown[] = [];
  for (let i = 0; i < count; i++) {
    results.push(generateFieldValue({ ...field, value: undefined }));
  }
  return results;
}
