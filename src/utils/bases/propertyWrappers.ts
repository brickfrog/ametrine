/**
 * Property Wrappers for Obsidian Bases Filter Syntax
 *
 * These wrappers enable method chaining on properties
 * Example: file.name.contains("test") instead of contains(file.name, "test")
 */

/**
 * String property wrapper with chainable methods
 */
export class StringWrapper {
  constructor(private value: string) {
    // Bind all methods to preserve 'this' context
    this.contains = this.contains.bind(this);
    this.containsAny = this.containsAny.bind(this);
    this.containsAll = this.containsAll.bind(this);
    this.startsWith = this.startsWith.bind(this);
    this.endsWith = this.endsWith.bind(this);
    this.isEmpty = this.isEmpty.bind(this);
    this.lower = this.lower.bind(this);
    this.upper = this.upper.bind(this);
    this.trim = this.trim.bind(this);
  }

  // Core string methods
  contains(searchString: string): boolean {
    return this.value.includes(searchString);
  }

  containsAny(...values: string[]): boolean {
    return values.some((v) => this.value.includes(v));
  }

  containsAll(...values: string[]): boolean {
    return values.every((v) => this.value.includes(v));
  }

  startsWith(searchString: string): boolean {
    return this.value.startsWith(searchString);
  }

  endsWith(searchString: string): boolean {
    return this.value.endsWith(searchString);
  }

  isEmpty(): boolean {
    return this.value.length === 0;
  }

  lower(): string {
    return this.value.toLowerCase();
  }

  upper(): string {
    return this.value.toUpperCase();
  }

  trim(): string {
    return this.value.trim();
  }

  // Properties
  get length(): number {
    return this.value.length;
  }

  // Allow direct comparison and string operations
  toString(): string {
    return this.value;
  }

  valueOf(): string {
    return this.value;
  }
}

/**
 * List/Array property wrapper with chainable methods
 */
export class ListWrapper<T = any> {
  constructor(private value: T[]) {
    // Bind all methods to preserve 'this' context
    this.contains = this.contains.bind(this);
    this.containsAny = this.containsAny.bind(this);
    this.containsAll = this.containsAll.bind(this);
    this.isEmpty = this.isEmpty.bind(this);
    this.join = this.join.bind(this);
  }

  // Core list methods
  contains(item: T): boolean {
    return this.value.includes(item);
  }

  containsAny(...items: T[]): boolean {
    return items.some((item) => this.value.includes(item));
  }

  containsAll(...items: T[]): boolean {
    return items.every((item) => this.value.includes(item));
  }

  isEmpty(): boolean {
    return this.value.length === 0;
  }

  join(separator: string = ","): string {
    return this.value.join(separator);
  }

  // Properties
  get length(): number {
    return this.value.length;
  }

  // Allow iteration and array operations
  [Symbol.iterator]() {
    return this.value[Symbol.iterator]();
  }

  toString(): string {
    return this.value.toString();
  }

  valueOf(): T[] {
    return this.value;
  }
}

/**
 * Date property wrapper with field accessors
 */
export class DateWrapper {
  constructor(private value: Date | undefined) {
    // Bind methods to preserve 'this' context
    this.isEmpty = this.isEmpty.bind(this);
  }

  // Date field accessors
  get year(): number {
    return this.value?.getFullYear() ?? 0;
  }

  get month(): number {
    return this.value ? this.value.getMonth() + 1 : 0; // 1-indexed for Obsidian
  }

  get day(): number {
    return this.value?.getDate() ?? 0;
  }

  get hour(): number {
    return this.value?.getHours() ?? 0;
  }

  get minute(): number {
    return this.value?.getMinutes() ?? 0;
  }

  get second(): number {
    return this.value?.getSeconds() ?? 0;
  }

  get millisecond(): number {
    return this.value?.getMilliseconds() ?? 0;
  }

  isEmpty(): boolean {
    return this.value === undefined || this.value === null;
  }

  // Allow direct date operations
  valueOf(): number {
    return this.value?.getTime() ?? 0;
  }

  toString(): string {
    return this.value?.toISOString() ?? "";
  }
}

/**
 * Wrap a string value to enable method chaining
 */
export function wrapString(value: string): StringWrapper {
  return new StringWrapper(value);
}

/**
 * Wrap an array value to enable method chaining
 */
export function wrapList<T = any>(value: T[]): ListWrapper<T> {
  return new ListWrapper(value);
}

/**
 * Wrap a date value to enable field access
 */
export function wrapDate(value: Date | undefined): DateWrapper {
  return new DateWrapper(value);
}
