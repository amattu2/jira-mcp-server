export type JiraIssueResponse = {
  /**
   * The unique identifier for the issue.
   * 
   * @example "DH-1234"
   */
  key: string;
  fields: {
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
    issuelinks: Array<unknown>;
  }
};


/**
 * Given a Jira ticket ID, fetches the ticket details from the Jira API.
 *
 * @param ticketId The ID of the Jira ticket to fetch.
 * @returns A promise that resolves to the ticket details.
 */
export const getJiraTicket = async (baseUrl: string, ticketId: string, apiToken: string): Promise<JiraIssueResponse | null> => {
  const response = await fetch(`${baseUrl}/rest/api/2/issue/${ticketId}?fields=summary,description,issuelinks`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    return null;
  }

  const data: JiraIssueResponse = await response.json();
  if (data.key !== ticketId) {
    return null;
  }

  return data;
};
