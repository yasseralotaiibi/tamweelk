export type ValidationIssue = {
  path: string;
  code: string;
  message: string;
};

export type ParseSuccess<T> = { success: true; data: T };
export type ParseFailure = { success: false; errors: ValidationIssue[] };
export type ParseResult<T> = ParseSuccess<T> | ParseFailure;

export interface Schema<T> {
  safeParse(value: unknown, path?: string): ParseResult<T>;
}

const issue = (path: string, code: string, message: string): ValidationIssue => ({
  path: path || 'root',
  code,
  message,
});

const mergeResults = <T>(
  results: Array<ParseResult<T>>
): { data: T[]; errors: ValidationIssue[] } => {
  const data: T[] = [];
  const errors: ValidationIssue[] = [];
  for (const result of results) {
    if (result.success) {
      data.push(result.data);
    } else {
      errors.push(...result.errors);
    }
  }
  return { data, errors };
};

export const string = (options?: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  format?: 'datetime';
}): Schema<string> => ({
  safeParse(value: unknown, path = ''): ParseResult<string> {
    if (typeof value !== 'string') {
      return { success: false, errors: [issue(path, 'invalid_type', 'Expected string')] };
    }

    if (options?.minLength !== undefined && value.length < options.minLength) {
      return {
        success: false,
        errors: [
          issue(path, 'too_small', `Must contain at least ${options.minLength} characters`),
        ],
      };
    }

    if (options?.maxLength !== undefined && value.length > options.maxLength) {
      return {
        success: false,
        errors: [
          issue(path, 'too_large', `Must contain at most ${options.maxLength} characters`),
        ],
      };
    }

    if (options?.pattern && !options.pattern.test(value)) {
      return {
        success: false,
        errors: [issue(path, 'invalid_string', 'Value does not match required format')],
      };
    }

    if (options?.format === 'datetime') {
      const timestamp = Date.parse(value);
      if (Number.isNaN(timestamp)) {
        return {
          success: false,
          errors: [issue(path, 'invalid_datetime', 'Invalid ISO-8601 datetime string')],
        };
      }
    }

    return { success: true, data: value };
  },
});

export const number = (options?: {
  min?: number;
  max?: number;
  int?: boolean;
  positive?: boolean;
}): Schema<number> => ({
  safeParse(value: unknown, path = ''): ParseResult<number> {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { success: false, errors: [issue(path, 'invalid_type', 'Expected number')] };
    }

    if (options?.int && !Number.isInteger(value)) {
      return {
        success: false,
        errors: [issue(path, 'invalid_integer', 'Expected integer number')],
      };
    }

    if (options?.positive && value <= 0) {
      return {
        success: false,
        errors: [issue(path, 'invalid_number', 'Must be greater than zero')],
      };
    }

    if (options?.min !== undefined && value < options.min) {
      return {
        success: false,
        errors: [issue(path, 'too_small', `Must be greater than or equal to ${options.min}`)],
      };
    }

    if (options?.max !== undefined && value > options.max) {
      return {
        success: false,
        errors: [issue(path, 'too_large', `Must be less than or equal to ${options.max}`)],
      };
    }

    return { success: true, data: value };
  },
});

export const boolean = (): Schema<boolean> => ({
  safeParse(value: unknown, path = ''): ParseResult<boolean> {
    if (typeof value !== 'boolean') {
      return { success: false, errors: [issue(path, 'invalid_type', 'Expected boolean')] };
    }

    return { success: true, data: value };
  },
});

export const enumeration = <T extends string>(values: readonly T[]): Schema<T> => ({
  safeParse(value: unknown, path = ''): ParseResult<T> {
    if (typeof value !== 'string') {
      return { success: false, errors: [issue(path, 'invalid_type', 'Expected string')] };
    }

    if (!values.includes(value as T)) {
      return {
        success: false,
        errors: [issue(path, 'invalid_enum', `Must be one of: ${values.join(', ')}`)],
      };
    }

    return { success: true, data: value as T };
  },
});

export const optional = <T>(schema: Schema<T>): Schema<T | undefined> => ({
  safeParse(value: unknown, path = ''): ParseResult<T | undefined> {
    if (value === undefined) {
      return { success: true, data: undefined };
    }
    return schema.safeParse(value, path);
  },
});

export const array = <T>(schema: Schema<T>, options?: { minLength?: number }): Schema<T[]> => ({
  safeParse(value: unknown, path = ''): ParseResult<T[]> {
    if (!Array.isArray(value)) {
      return { success: false, errors: [issue(path, 'invalid_type', 'Expected array')] };
    }

    if (options?.minLength !== undefined && value.length < options.minLength) {
      return {
        success: false,
        errors: [issue(path, 'too_small', `Must contain at least ${options.minLength} items`)],
      };
    }

    const results = value.map((item, index) => schema.safeParse(item, `${path}[${index}]`));
    const merged = mergeResults(results);
    if (merged.errors.length > 0) {
      return { success: false, errors: merged.errors };
    }

    return { success: true, data: merged.data };
  },
});

export const object = <Shape extends Record<string, Schema<any>>>(
  shape: Shape,
  options?: { allowUnknown?: boolean }
): Schema<{ [K in keyof Shape]: Infer<Shape[K]> }> => ({
  safeParse(value: unknown, path = '') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { success: false, errors: [issue(path, 'invalid_type', 'Expected object')] };
    }

    const data: Record<string, unknown> = {};
    const errors: ValidationIssue[] = [];
    const record = value as Record<string, unknown>;

    for (const key of Object.keys(shape)) {
      const schema = shape[key];
      const result = schema.safeParse(record[key], path ? `${path}.${key}` : key);
      if (result.success) {
        data[key] = result.data;
      } else {
        errors.push(...result.errors);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    if (options?.allowUnknown === false) {
      for (const key of Object.keys(record)) {
        if (!(key in shape)) {
          errors.push(issue(path ? `${path}.${key}` : key, 'unknown_key', 'Unknown property'));
        }
      }
      if (errors.length > 0) {
        return { success: false, errors };
      }
    }

    return { success: true, data: data as { [K in keyof Shape]: Infer<Shape[K]> } };
  },
});

export type Infer<TSchema> = TSchema extends Schema<infer TResult> ? TResult : never;
