import type { JiraIssue } from "../api/jira.js";

/**
 * Sorts Jira issues by their issue type. With the following priority:
 * 1. User Story
 * 2. Tasks
 * 3. Bugs
 * 4. All other issue types (in no particular order)
 * 
 * @param issues The Jira issues to sort.
 * @returns The sorted Jira issues.
 */
export const sortByIssueType = (...issues: JiraIssue[]): JiraIssue[] => {
  if (!issues || issues.length === 0) {
    return [];
  }

  const priorityMap: Record<string, number> = {
    "User Story": 1,
    Task: 2,
    Bug: 3,
  };

  return issues.sort((a, b) => {
    const aPriority = priorityMap[a.fields.issuetype.name] || 4;
    const bPriority = priorityMap[b.fields.issuetype.name] || 4;
    return aPriority - bPriority;
  });
};
