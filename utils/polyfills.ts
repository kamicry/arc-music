// Polyfills for Safari 12 compatibility

// String.prototype.padEnd polyfill
if (!(String.prototype as any).padEnd) {
  (String.prototype as any).padEnd = function(targetLength: number, padString: string = ' '): string {
    targetLength = targetLength >> 0; // floor if number or convert non-number to 0
    padString = String(padString || ' ');
    if (this.length > targetLength) {
      return String(this);
    }
    targetLength = targetLength - this.length;
    if (targetLength > padString.length) {
      padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
    }
    return String(this) + padString.slice(0, targetLength);
  };
}

// String.prototype.matchAll polyfill
if (!(String.prototype as any).matchAll) {
  (String.prototype as any).matchAll = function(regexp: RegExp): any {
    const matches: any[] = [];
    const str = String(this);
    const flags = regexp.flags ? (regexp.flags.includes('g') ? regexp.flags : regexp.flags + 'g') : 'g';
    const regex = new RegExp(regexp.source, flags);
    let match: any;
    while ((match = regex.exec(str)) !== null) {
      matches.push(match);
    }
    let index = 0;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        if (index < matches.length) {
          return { value: matches[index++], done: false };
        }
        return { value: undefined, done: true };
      }
    };
  };
}

// URLSearchParams polyfill
if (typeof URLSearchParams === 'undefined') {
  (global as any).URLSearchParams = class URLSearchParams {
    private params: { [key: string]: string[] } = {};

    constructor(init?: string | Record<string, string> | string[][]) {
      if (init) {
        if (typeof init === 'string') {
          init.split('&').forEach((pair) => {
            const [key, value] = pair.split('=');
            if (key) {
              this.append(decodeURIComponent(key), decodeURIComponent(value || ''));
            }
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.append(key, value));
        } else if (typeof init === 'object') {
          Object.keys(init).forEach((key) => this.append(key, init[key]));
        }
      }
    }

    append(name: string, value: string): void {
      if (!this.params[name]) {
        this.params[name] = [];
      }
      this.params[name].push(String(value));
    }

    delete(name: string): void {
      delete this.params[name];
    }

    get(name: string): string | null {
      const values = this.params[name];
      return values && values.length > 0 ? values[0] : null;
    }

    getAll(name: string): string[] {
      return this.params[name] || [];
    }

    has(name: string): boolean {
      return name in this.params;
    }

    set(name: string, value: string): void {
      this.params[name] = [String(value)];
    }

    sort(): void {
      const keys = Object.keys(this.params).sort();
      const sorted: { [key: string]: string[] } = {};
      keys.forEach((key) => {
        sorted[key] = this.params[key];
      });
      this.params = sorted;
    }

    toString(): string {
      const pairs: string[] = [];
      Object.keys(this.params).forEach((key) => {
        this.params[key].forEach((value) => {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        });
      });
      return pairs.join('&');
    }

    forEach(callback: (value: string, name: string, searchParams: URLSearchParams) => void): void {
      Object.keys(this.params).forEach((name) => {
        this.params[name].forEach((value) => {
          callback(value, name, this as unknown as URLSearchParams);
        });
      });
    }

    entries(): IterableIterator<[string, string]> {
      const entries: [string, string][] = [];
      Object.keys(this.params).forEach((name) => {
        this.params[name].forEach((value) => {
          entries.push([name, value]);
        });
      });
      let index = 0;
      return {
        [Symbol.iterator]() {
          return this;
        },
        next() {
          if (index < entries.length) {
            return { value: entries[index++], done: false };
          }
          return { value: undefined, done: true };
        }
      } as IterableIterator<[string, string]>;
    }

    keys(): IterableIterator<string> {
      const keys = Object.keys(this.params);
      let index = 0;
      return {
        [Symbol.iterator]() {
          return this;
        },
        next() {
          if (index < keys.length) {
            return { value: keys[index++], done: false };
          }
          return { value: undefined, done: true };
        }
      } as IterableIterator<string>;
    }

    values(): IterableIterator<string> {
      const values: string[] = [];
      Object.keys(this.params).forEach((name) => {
        this.params[name].forEach((value) => {
          values.push(value);
        });
      });
      let index = 0;
      return {
        [Symbol.iterator]() {
          return this;
        },
        next() {
          if (index < values.length) {
            return { value: values[index++], done: false };
          }
          return { value: undefined, done: true };
        }
      } as IterableIterator<string>;
    }
  };
}

// Number.isFinite polyfill
if (typeof Number.isFinite !== 'function') {
  Number.isFinite = function(value: any): boolean {
    return typeof value === 'number' && isFinite(value);
  };
}

// Browser compatibility check
export function checkBrowserCompatibility(): {
  isCompatible: boolean;
  issues: string[];
  browserInfo: { name: string; version: number };
} {
  const issues: string[] = [];
  const ua = navigator.userAgent;
  let browserName = 'unknown';
  let browserVersion = 0;

  // Detect Safari
  const safariMatch = ua.match(/Version\/(\d+\.\d+)/);
  if (safariMatch && ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    browserName = 'Safari';
    browserVersion = parseFloat(safariMatch[1]);
  }

  // Check for critical features
  if (typeof Promise === 'undefined') {
    issues.push('Promise not supported');
  }

  if (typeof fetch === 'undefined') {
    issues.push('Fetch API not supported');
  }

  if (typeof Audio === 'undefined') {
    issues.push('Web Audio API not supported');
  }

  // Safari specific checks
  if (browserName === 'Safari' && browserVersion < 12) {
    issues.push(`Safari ${browserVersion} is not supported (minimum 12.0)`);
  }

  return {
    isCompatible: issues.length === 0,
    issues,
    browserInfo: {
      name: browserName,
      version: browserVersion
    }
  };
}

// Safe URLSearchParams wrapper
export function createSearchParams(params: Record<string, string>): string {
  if (typeof URLSearchParams !== 'undefined') {
    return new URLSearchParams(params).toString();
  }
  // Fallback for browsers without URLSearchParams
  return Object.keys(params)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
}
