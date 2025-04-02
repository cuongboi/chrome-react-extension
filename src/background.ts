import { GHRegex } from './lib/contains';

const getMatchedTabs = async () => {
  const tabs = await chrome.tabs.query({
    currentWindow: true,
  });

  const ghTabs = tabs.filter((tab) => {
    return tab.url?.match(GHRegex);
  });

  return ghTabs;
};

chrome.webRequest.onCompleted.addListener(
  async (details) => {
    const url = new URL(details.url);
    const params = new URLSearchParams(url.search);

    if (params.get('from') === 'extension') {
      return;
    }

    url.searchParams.append('from', 'extension');

    const tabs = await getMatchedTabs();

    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'extension:paginated_items',
          url,
        });
      }
    });
  },
  {
    urls: ['*://github.com/memexes/*/paginated_items*'],
  },
);
