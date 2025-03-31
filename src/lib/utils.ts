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
    return chrome.storage.sync
      .set({ [key]: value })
      .then(() => value)
      .catch(console.log);
  },
  get: async (key: string) => {
    return chrome.storage.sync
      .get(key)
      .then((result) => result[key])
      .catch(console.log);
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
