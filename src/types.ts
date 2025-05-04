export interface IssueData {
  id: string;
  updatedAt: string;
  title: string;
  number: number;
  repository: Repository;
  titleHTML: string;
  url: string;
  viewerCanUpdateNext: boolean;
  issueType: any;
  state: string;
  stateReason: any;
  duplicateOf: any;
  linkedPullRequests: LinkedPullRequests;
  subIssuesSummary: SubIssuesSummary;
  __isLabelable: string;
  labels: Labels;
  __isNode: string;
  assignees: Assignees;
  milestone: any;
  databaseId: number;
  viewerDidAuthor: boolean;
  locked: boolean;
  author: Author;
  __isComment: string;
  body: string;
  bodyHTML: string;
  bodyVersion: string;
  createdAt: string;
  __isReactable: string;
  reactionGroups: ReactionGroup[];
  viewerCanUpdateMetadata: boolean;
  viewerCanComment: boolean;
  viewerCanAssign: boolean;
  viewerCanLabel: boolean;
  __isIssueOrPullRequest: string;
  projectItemsNext: ProjectItemsNext;
  viewerCanSetMilestone: boolean;
  isPinned: boolean;
  viewerCanDelete: boolean;
  viewerCanTransfer: boolean;
  viewerCanConvertToDiscussion: boolean;
  viewerCanLock: boolean;
  viewerCanType: boolean;
  frontTimelineItems: FrontTimelineItems;
  backTimelineItems: BackTimelineItems;
}

export interface Repository {
  nameWithOwner: string;
  id: string;
  name: string;
  owner: Owner;
  isArchived: boolean;
  isPrivate: boolean;
  databaseId: number;
  slashCommandsEnabled: boolean;
  viewerCanInteract: boolean;
  viewerInteractionLimitReasonHTML: string;
  planFeatures: PlanFeatures;
  visibility: string;
  pinnedIssues: PinnedIssues;
  viewerCanPinIssues: boolean;
  issueTypes: any;
}

export interface Owner {
  __typename: string;
  login: string;
  id: string;
  url: string;
}

export interface PlanFeatures {
  maximumAssignees: number;
}

export interface PinnedIssues {
  totalCount: number;
}

export interface LinkedPullRequests {
  nodes: any[];
}

export interface SubIssuesSummary {
  total: number;
  completed: number;
}

export interface Labels {
  edges: any[];
  pageInfo: PageInfo;
}

export interface PageInfo {
  endCursor: any;
  hasNextPage: boolean;
}

export interface Assignees {
  nodes: LoginNode[];
}

export interface LoginNode {
  id: string;
  login: string;
  name: string;
  avatarUrl: string;
}

export interface Author {
  __typename: string;
  __isActor: string;
  login: string;
  id: string;
  profileUrl: string;
  avatarUrl: string;
}

export interface ReactionGroup {
  content: string;
  viewerHasReacted: boolean;
  reactors: Reactors;
}

export interface Reactors {
  totalCount: number;
  nodes: any[];
}

export interface ProjectItemsNext {
  edges: any[];
  pageInfo: PageInfo2;
}

export interface PageInfo2 {
  endCursor: any;
  hasNextPage: boolean;
}

export interface FrontTimelineItems {
  pageInfo: PageInfo3;
  totalCount: number;
  edges: Edge[];
}

export interface PageInfo3 {
  hasNextPage: boolean;
  endCursor: string;
}

export interface Edge {
  node: IssueComment;
  cursor: string;
}

export interface IssueComment {
  __typename: string;
  __isIssueTimelineItems: string;
  databaseId: number;
  viewerDidAuthor?: boolean;
  issue?: Issue;
  author?: Author3;
  id: string;
  body?: string;
  bodyHTML?: string;
  bodyVersion?: string;
  viewerCanUpdate?: boolean;
  url?: string;
  createdAt: string;
  authorAssociation?: string;
  viewerCanDelete?: boolean;
  viewerCanMinimize?: boolean;
  viewerCanReport?: boolean;
  viewerCanReportToMaintainer?: boolean;
  viewerCanBlockFromOrg?: boolean;
  viewerCanUnblockFromOrg?: boolean;
  isHidden?: boolean;
  minimizedReason: any;
  showSpammyBadge?: boolean;
  createdViaEmail?: boolean;
  authorToRepoOwnerSponsorship: any;
  repository?: Repository2;
  __isComment?: string;
  viewerCanReadUserContentEdits?: boolean;
  lastEditedAt?: string;
  lastUserContentEdit?: LastUserContentEdit;
  __isReactable?: string;
  reactionGroups?: ReactionGroup2[];
  __isNode: string;
  __isTimelineEvent?: string;
  actor?: Actor;
  assignee?: Assignee;
  status?: string;
  previousStatus?: string;
  data?: {
    content: string;
    metadata: Record<string, string>;
  };
}

export interface Issue {
  author: Author2;
  id: string;
  number: number;
  locked: boolean;
  databaseId: number;
}

export interface Author2 {
  __typename: string;
  login: string;
  id: string;
}

export interface Author3 {
  __typename: string;
  login: string;
  avatarUrl: string;
  id: string;
}

export interface Repository2 {
  id: string;
  name: string;
  owner: Owner2;
  isPrivate: boolean;
  slashCommandsEnabled: boolean;
  nameWithOwner: string;
  databaseId: number;
}

export interface Owner2 {
  __typename: string;
  id: string;
  login: string;
  url: string;
}

export interface LastUserContentEdit {
  editor: Editor;
  id: string;
}

export interface Editor {
  __typename: string;
  url: string;
  login: string;
  id: string;
}

export interface ReactionGroup2 {
  content: string;
  viewerHasReacted: boolean;
  reactors: Reactors2;
}

export interface Reactors2 {
  totalCount: number;
  nodes: any[];
}

export interface Actor {
  __typename: string;
  login: string;
  id: string;
  __isActor: string;
  avatarUrl: string;
}

export interface Assignee {
  avatarUrl: string;
  id: number;
  login: string;
  url: string;
}
export interface BackTimelineItems {
  pageInfo: PageInfo4;
  totalCount: number;
  edges: any[];
}

export interface PageInfo4 {
  hasPreviousPage: boolean;
  startCursor: any;
}

export interface UrlIssue {
  owner: string;
  repo: string;
  type: string; // 'issues' | 'pulls' | 'projects';
  number: string;
}

export interface TaskItem {
  id: number;
  contentId: number;
  contentType: string;
  Title: Title;
  Assignees: Assignee[];
  Status: StatusValue;
  Labels: ValueLabels[];
  start: ValueString;
  end: ValueString;
  actualStart: ValueString;
  actualEnd: ValueString;
  progress: ValueNumber;
  parentId: ValueNumber;
  group?: Group;
  status: string;
}

export interface Title {
  url: string;
  state: string;
  title: {
    raw: string;
    html: string;
  };
  number: number;
  issueId: number;
  stateReason: any;
}

export interface StatusValue {
  id: string;
  name: string;
  color: string;
  description: string;
  nameHtml: string;
  descriptionHtml: string;
}

export interface ValueString {
  value: string;
}

export interface ValueLabels {
  color: string;
  id: number;
  name: string;
  nameHtml: string;
  url: string;
}

export interface ValueNumber {
  value: number;
}

export interface Group {
  groupValue: string;
  groupId: string;
  groupMetadata: GroupMetadata;
  totalCount: TotalCount;
  fieldMetrics: any[];
}

export interface GroupMetadata {
  id: string;
  title: string;
  titleHtml: string;
  startDate: string;
  duration: number;
}

export interface TotalCount {
  value: number;
  isApproximate: boolean;
}

export interface GroupItem {
  groupId: string;
  nodes: Node[];
  pageInfo: PageInfo;
}

export interface ProjectItemNode {
  contentId: number;
  contentType: string;
  contentRepositoryId?: number;
  id: number;
  priority: any;
  virtualPriority: string;
  updatedAt: string;
  createdAt: string;
  issueCreatedAt?: string;
  issueClosedAt?: string;
  state?: string;
  [key: string]: any;
}

export type IssueUrl = {
  id: string;
  url: string;
  owner: string;
  repo: string;
  issue: string;
};
