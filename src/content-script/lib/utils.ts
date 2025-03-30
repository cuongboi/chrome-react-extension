import type { UrlIssue } from '../types';

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
