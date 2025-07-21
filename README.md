# Introduction

This repository provides a Model Context Provider (MCP) server that integrates
Jira tickets with GitHub Copilot Chat. It fetches relevant information from
Jira to enhance the context for AI-driven code suggestions.

## Features

TODO

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/amattu2/jira-mcp-server.git
   cd jira-mcp-server
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Build the project:

    ```bash
    npm run build
    ```

4. Setup the VSCode MCP (`.vscode/mcp.json`):

    ```json
    {
      "servers": {
        "jira-ticket-mcp": {
          "type": "stdio",
          "command": "node",
          "args": [
            "path_to_the_project/build/index.js"
          ],
          "env": {
            "JIRA_API_TOKEN": "${input:jira-api-token}",
            "JIRA_BASE_URL": "${input:jira-base-url}",
          },
        }
      },
      "inputs": [
        {
          "type": "promptString",
          "id": "jira-api-token",
          "description": "The Jira API token to use for authentication",
          "password": true
        },
        {
          "type": "promptString",
          "id": "jira-base-url",
          "description": "The base URL of the Jira instance (e.g. https://example.com)",
          "password": false
        }
      ]
    }
    ```
