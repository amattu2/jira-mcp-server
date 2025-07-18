import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getJiraTicket, JiraIssue } from "./api/jira.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { sortByIssueType } from "./utils/jiraUtils.js";

/**
 * The base URL of the Jira instance to connect to.
 * This should be provided as the first command-line argument.
 */
const JIRA_BASE_URL = process.argv[2];

/**
 * The Jira API token to use for authentication.
 * This should be provided as the second command-line argument.
 */
const JIRA_API_TOKEN = process.argv[3];

/**
 * The MCP server instance.
 */
const server = new McpServer({
  name: "jira-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "get-ticket",
  "Get the details of a Jira ticket and any linked tickets.",
  {
    reference: z.string().regex(/^[A-Z]+-\d+$/),
  },
  async ({ reference }): Promise<CallToolResult> => {
    const ticketId = reference;

    if (!JIRA_BASE_URL) {
      throw new Error("Please provide your Jira base URL as the first argument.");
    }
    
    if (!JIRA_API_TOKEN) {
      throw new Error("Please provide your Jira API token as the second argument.");
    }

    const primaryTicket: JiraIssue | null = await getJiraTicket(JIRA_BASE_URL, ticketId, JIRA_API_TOKEN);
    if (!primaryTicket?.key) {
      throw new Error(`Failed to retrieve details for ticket ${ticketId}`);
    }

    const additionalTickets: JiraIssue[] = [];
    if (primaryTicket.fields.issuelinks.length > 0) {
      const linkedTicketPromises = primaryTicket.fields.issuelinks.map(async (link) => {
        const linkedTicketId = link.outwardIssue ? link.outwardIssue.key : link.inwardIssue?.key;
        if (linkedTicketId) {
          const linkedTicketDetails = await getJiraTicket(JIRA_BASE_URL, linkedTicketId, JIRA_API_TOKEN, ["summary", "description", "issuetype"]);
          if (linkedTicketDetails) {
            additionalTickets.push(linkedTicketDetails);
          }
        }
      });

      await Promise.allSettled(linkedTicketPromises);
    }

    const sortedTickets: JiraIssue[] = sortByIssueType(primaryTicket, ...additionalTickets);
    let resultMarkdown = ``;
    sortedTickets.forEach((ticket: JiraIssue) => {
      // TODO: Include component label if available (Backend, Frontend, etc)
      resultMarkdown += `# ${ticket.fields.issuetype.name} - ${ticket.fields.summary}\n`;
      resultMarkdown += `${ticket.fields.description}\n`;
      resultMarkdown += `\n---\n\n`;
    });

    return {
      content: [
        {
          type: "text",
          text: resultMarkdown.trim(), 
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Running Jira MCP server on stdin/stdout");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
