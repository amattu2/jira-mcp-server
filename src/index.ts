import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getJiraTicket } from "./api/jira.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

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

const server = new McpServer({
  name: "jira-mcp-server",
  version: "1.0.0",
  capabilities: {
    resources: {
    },
    tools: {},
  },
});

server.tool(
  "get-ticket",
  "Get the details of a Jira ticket",
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

    const ticketDetails = await getJiraTicket(JIRA_BASE_URL, ticketId, JIRA_API_TOKEN);
    if (!ticketDetails) {
      throw new Error(`Failed to retrieve details for ticket ${ticketId}`);
    }

    return {
      content: [
        {
          type: "text",
          // TODO: Format as document, get linked ticket details too
          text: `Ticket Summary: ${ticketDetails.fields.summary}\nDescription: ${ticketDetails.fields.description || "No description provided."}`, 
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
