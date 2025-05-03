import { clsx, type ClassValue } from 'clsx';
import elementReady, { type Options } from 'element-ready';
import { twMerge } from 'tailwind-merge';

import type { UrlIssue } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function $<T extends Element>(selector: string) {
  return document.querySelector<T>(selector);
}

export function $$<T extends Element>(selector: string) {
  return document.querySelectorAll<T>(selector);
}

export const waitFor = async (duration = 1000) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export const waitForElement = async (selector: string, options?: Options) => {
  return elementReady(selector, {
    stopOnDomReady: false,
    ...options,
  });
};

export const getCurrentTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
};

/**
 * convenient method for chrome.storage
 */
export const storage = {
  set: async (key: string, value: unknown) => {
    return chrome.storage.sync.set({ [key]: value }).then(() => value);
  },
  get: async (key: string) => {
    return chrome.storage.sync.get(key).then((result) => result[key]);
  },
};

export function stringToColorHash(str: string): string {
  let hash: number = 0;
  for (let i: number = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color: string = '#';
  for (let i: number = 0; i < 3; i++) {
    const value: number = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color.toUpperCase();
}

export const joinPath = (...paths: string[]) => {
  return paths.join('/').replace(/\/+/g, '/').replace(/\/$/, '');
};

export const parseIssueUrl = (url: string): UrlIssue | null => {
  const regex = /github\.com\/([^/]+)\/([^/]+)\/(\w+)\/(\d+)/;
  const match = url.match(regex);
  if (match) {
    const [, owner, repo, type, number] = match;
    return { owner, repo, type, number };
  }
  return null;
};

export const swapObject = <T extends object>(
  obj: T,
): { [key: string]: string } => {
  const ret: { [key: string]: string } = {};
  for (const key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      ret[String(obj[key])] = key;
    }
  }
  return ret;
};

export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const delay = <T>(fn: (...args: any[]) => T, ms: number) => {
  let timer: number;

  return function (...args: any[]) {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
    }, ms);
  };
};

type ColorUnion =
  | 'GRAY'
  | 'RED'
  | 'BLUE'
  | 'GREEN'
  | 'YELLOW'
  | 'PURPLE'
  | 'ORANGE'
  | 'PINK'
  | 'DEFAULT';

export const convertColor = (color: ColorUnion) => {
  switch (color) {
    case 'GRAY':
      return 'var(--borderColor-neutral-muted)';
    case 'RED':
      return 'var(--borderColor-danger-muted)';
    case 'BLUE':
      return 'var(--borderColor-accent-muted)';
    case 'GREEN':
      return 'var(--borderColor-success-muted)';
    case 'YELLOW':
      return 'var(--borderColor-attention-muted)';
    case 'PURPLE':
      return 'var(--borderColor-done-muted)';
    case 'ORANGE':
      return 'var(--borderColor-severe-muted)';
    case 'PINK':
      return 'var(--borderColor-sponsors-muted)';
    default:
      return 'var(--borderColor-neutral)';
  }
};

export const getStatusColor = (
  status: string,
  options: { id: string; color: ColorUnion; [key: string]: string }[],
) => {
  const statusOption = (options ?? []).find((option) => option.id === status);
  if (statusOption) {
    return convertColor(statusOption.color);
  }
  return convertColor('DEFAULT');
};

export function deepEquals(a: any, b: any): boolean {
  if (a === b) return true;

  if (
    a == null ||
    b == null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEquals(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

export const getUrlPath = () => {
  const url = window.location.href;
  const matcher = /(orgs|users)\/(\w+)\/projects\/(\d+)/;

  const [, type, name, id] = url.match(matcher) || [];

  return {
    type,
    name,
    id,
    key: `${type}:${name}:${id}`,
  };
};

declare global {
  interface Number {
    pluralize: (one: string, other: string) => string;
  }

  interface String {
    parseJson: <T = unknown>() => T;
  }
}

Number.prototype.pluralize = function (one: string, other: string) {
  return `${this} ${this === 1 ? one : other}`;
};

String.prototype.parseJson = function <T = unknown>(): T {
  try {
    return JSON.parse(String(this));
  } catch {
    return {} as T;
  }
};
