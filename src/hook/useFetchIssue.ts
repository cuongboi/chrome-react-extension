import { load } from 'cheerio';
import parseMD from 'parse-md';
import { useEffect, useState } from 'react';

import { joinPath, parseIssueUrl } from '../lib/utils';
import type { IssueData, IssueComment } from '../types';

export function useFetchIssue() {
  const [issueData, setIssueData] = useState<IssueData>();
  const [manageComment, setManageComment] = useState<IssueComment>();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const url = window.location.href;
    const issueUrl = parseIssueUrl(url);

    if (issueUrl && issueUrl.type === 'issues') {
      const fetchData = async () => {
        try {
          const response = await fetch(
            joinPath(
              '/',
              issueUrl.owner,
              issueUrl.repo,
              issueUrl.type,
              issueUrl.number,
            ),
            {
              method: 'GET',
              mode: 'no-cors',
              credentials: 'include',
            },
          );
          const text = await response.text();
          const $ = load(text);
          const dataRaw = $('[data-target="react-app.embeddedData"]').text();
          const parsedData: IssueData =
            JSON.parse(dataRaw).payload.preloadedQueries[0].result.data
              .repository.issue;
          setIssueData(parsedData);

          // Process manage comment
          const manageComment = parsedData.frontTimelineItems.edges.find(
            (edge) => {
              const parseNode = parseMD(edge.node.body || '') as Record<
                string,
                any
              >;
              return parseNode.metadata.scope === 'issue';
            },
          )?.node;

          if (manageComment) {
            setManageComment({
              ...manageComment,
              data: parseMD(manageComment?.body || '') as IssueComment['data'],
            });
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsReady(true);
        }
      };

      fetchData();

      // Oserver for changes [data-testid="issue-timeline-container"]
      const observer = new MutationObserver(() => {
        const newIssueUrl = parseIssueUrl(window.location.href);
        if (newIssueUrl && newIssueUrl.type === 'issues') {
          fetchData();
        }
      });

      const targetNode = document.querySelector(
        '[data-testid="issue-timeline-container"]',
      );
      if (targetNode) {
        observer.observe(targetNode, {
          childList: true,
          subtree: true,
        });
      }
    }
  }, []);

  return { issueData, manageComment, isReady };
}
