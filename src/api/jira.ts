export type JiraIssue = {
  /**
   * Internal unique identifier for the issue.
   */
  id: string;
  /**
   * The unique identifier for the issue.
   *
   * @example "DH-1234"
   */
  key: string;
  /**
   * A collection of fields associated with the issue.
   */
  fields: JiraIssueFields;
};

export type JiraIssueFields = {
  /**
   * The summary (title) of the issue.
   */
  summary: string;
  /**
   * The description of the issue.
   */
  description: string;
  /**
   * The issue links associated with the issue.
   */
  issuelinks: Array<JiraIssueLink>;
  /**
   * The type of issue (e.g., Bug, Task, Story).
   */
  issuetype: JiraIssueType;
} & Record<string, unknown>;

export type JiraIssueLink = {
  /**
   * The unique identifier for the issue link.
   */
  id: string;
  /**
   * The type of the issue link.
   *
   * @note If `inwardIssue` is defined, then `outwardIssue` will be undefined, and vice versa.
   */
  inwardIssue?: Pick<JiraIssue, "id" | "key"> & {
    fields: Pick<JiraIssueFields, "summary">;
  };
  /**
   * The outward issue linked to this issue.
   *
   * @note If `outwardIssue` is defined, then `inwardIssue` will be undefined, and vice versa.
   */
  outwardIssue?: Pick<JiraIssue, "id" | "key"> & {
    fields: Pick<JiraIssueFields, "summary">;
  };
  /**
   * The type of the issue link, including its name and description.
   */
  type: JiraIssueType;
};

export type JiraIssueType = {
  /**
   * The unique identifier for the issue type.
   */
  id: string;
  /**
   * The name of the issue type.
   *
   * @example Task
   */
  name: string;
};

/**
 * Given a Jira ticket ID, fetches the ticket details from the Jira API.
 *
 * @param baseUrl The base URL of the Jira API.
 * @param ticketId The ID of the Jira ticket to fetch.
 * @param apiToken The API token for authentication.
 * @param fieldset An array of fields to include in the response.
 * @returns A promise that resolves to the ticket details.
 */
export const getJiraTicket = async (
  baseUrl: string,
  ticketId: string,
  apiToken: string,
  fieldset: (keyof JiraIssueFields)[] = [
    "summary",
    "description",
    "issuetype",
    "issuelinks",
  ],
): Promise<JiraIssue | null> => {
  if (!baseUrl || !ticketId || !apiToken) {
    throw new Error("Base URL, ticket ID, and API token are required.");
  }

  if (fieldset.length === 0) {
    throw new Error("At least one field must be specified in the fieldset.");
  }

  const response = await fetch(
    `${baseUrl}/rest/api/2/issue/${ticketId}?fields=${fieldset.join(",")}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`API returned a non-OK response`);
  }

  const data: JiraIssue = await response.json();
  if (data.key !== ticketId) {
    throw new Error(`API returned an unexpected ticket ID`);
  }

  return data;
};
