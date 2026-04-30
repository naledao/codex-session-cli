import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should perform basic arithmetic', () => {
    expect(1 + 1).toBe(2);
    expect(10 - 5).toBe(5);
    expect(3 * 4).toBe(12);
    expect(10 / 2).toBe(5);
  });

  it('should handle string operations', () => {
    const str = 'Hello, World!';
    expect(str.length).toBe(13);
    expect(str.toLowerCase()).toBe('hello, world!');
    expect(str.toUpperCase()).toBe('HELLO, WORLD!');
    expect(str.includes('World')).toBe(true);
  });

  it('should handle array operations', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr.length).toBe(5);
    expect(arr.includes(3)).toBe(true);
    expect(arr.filter(x => x > 3)).toEqual([4, 5]);
    expect(arr.map(x => x * 2)).toEqual([2, 4, 6, 8, 10]);
  });

  it('should handle object operations', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
    expect(Object.keys(obj)).toEqual(['name', 'value']);
    expect(Object.values(obj)).toEqual(['test', 42]);
  });

  it('should handle async operations', async () => {
    const asyncFunction = async () => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve('async result');
        }, 100);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('async result');
  });

  it('should handle errors', () => {
    const throwError = () => {
      throw new Error('Test error');
    };

    expect(throwError).toThrow('Test error');
    expect(throwError).toThrow(Error);
  });

  it('should handle null and undefined', () => {
    const nullValue = null;
    const undefinedValue = undefined;

    expect(nullValue).toBeNull();
    expect(nullValue).not.toBeUndefined();
    expect(undefinedValue).toBeUndefined();
    expect(undefinedValue).not.toBeNull();
  });

  it('should handle type checking', () => {
    expect(typeof 'string').toBe('string');
    expect(typeof 42).toBe('number');
    expect(typeof true).toBe('boolean');
    expect(typeof undefined).toBe('undefined');
    expect(typeof null).toBe('object');
    expect(Array.isArray([])).toBe(true);
    expect(Array.isArray({})).toBe(false);
  });
});