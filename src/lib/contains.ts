export const GHRequestHeaders = {
  accept: 'application/json',
  'accept-language': 'ja,en-US;q=0.9,en;q=0.8,vi;q=0.7',
  'content-type': 'application/json',
  'github-verified-fetch': 'true',
  priority: 'u=1, i',
  'sec-ch-ua':
    '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest',
};

export const GHRegex = /.*github\.com\/.*projects\/\d+.*/;
