# Building a Company Brain using MCP

An enterprise-grade project designed to centralize scattered corporate operating knowledge into an interactive, executable graph layer and a secure serverless Model Context Protocol (MCP) endpoint. This system allows LLMs and AI agents to seamlessly query, maintain, and execute organizational directives with full data safety and zero context guessing.

---

## 🧠 Core Concept & Inspiration

This project adapts the **LLM Wiki Pattern**. Rather than using an LLM token budget exclusively for writing code, tokens are systematically shifted to structuring and manipulating operational knowledge.

### The Core Problem

In a standard organization, critical knowledge lives scattered across Slack threads, email chains, isolated spreadsheets, internal tickets, and human memory. While humans navigate this mess using intuition, AI agents cannot. An agent that guesses about operational boundaries — especially financial ones — is a liability.

### The Solution: The Company Brain

This layer acts as an executable map of how a business functions. While a standard knowledge base stops at document retrieval, the **Company Brain** encodes context-aware judgment, empowering an AI agent to safely make permissioned decisions.

---

## 💼 High-Impact Production Use Case

This deployment is built for a **40-person logistics provider** to automate **Vendor Invoice Reconciliation**.

- **The Operational Load:** Eliminates the manual verification overhead of an outsourced finance team.
- **The 3-Way Match:** The server exposes tools to match incoming carrier invoices against existing Purchase Orders (POs) and Goods Received Notes (GRNs) to detect line-item discrepancies.
- **Context-Driven Payment Terms:** Automatically reads specific vendor settlement structures (e.g., Net-30 vs. Net-60) straight from the edge database to calculate dynamic payment windows.
- **Ceiling Guardrails:** Implements a strict validation loop. If an invoice contains an anomaly, a duplicate profile match, or an amount exceeding **$5,000**, the agent triggers a hard-stop and hands execution back to the founder for manual review.

---

## 🏗️ System Architecture

The infrastructure runs entirely serverless at the edge on Cloudflare.

```
[ Local Obsidian Vault ] ───( sync.js )───> [ Cloudflare KV Store ]
  (Markdown Memory)                                 │
                                                    ▼
[ Browser Visualizer ] ◄──────( GET / )────── [ Cloudflare Worker ]
[ Claude Desktop / Code ] ◄──( POST /mcp )─── [ (Serverless Handler) ]
```

### Infrastructure Components

| Component | Technology | Role |
|---|---|---|
| Semantic Layer | Obsidian Vault (Markdown) | Portable, lock-in-free knowledge authoring |
| Ingestion Pipeline | `sync.js` | Walks vault directories and pushes assets to KV |
| Storage Layer | Cloudflare KV | Globally distributed edge key-value store |
| Intelligence Layer | Cloudflare Worker (ES Module) | Stateless JSON-RPC MCP hosting endpoint |

---

## 🌐 Living Network Visualizer

When hitting the root URL (`/`), the worker reads keys from Cloudflare KV, parses internal markdown links, and renders an interactive **Obsidian-style animated graph** directly on a 2D canvas layout.

### Visual Design Tokens

- **Theme Background:** Premium cinematic dark graphite (`#0B0F19`)
- **Backdrop Engine:** Procedural animated neural mesh modeling a sagittal cerebral silhouette with floating synapse particle pathways

### Node Category Legend

| Color | Layer | Maps To |
|---|---|---|
| 🟠 `#C65D07` | Sources | Raw operational data logs, emails, intake inputs |
| 🔵 `#00f5ff` | Concepts | Rules, logic constraints, SOPs |
| 🟣 `#8a2be2` | Entities | Stakeholder roles, teams, vendor profiles |
| 💗 `#ff1493` | Synthesis | Cross-source insights, strategic milestone maps |

---

## 🛠️ Exposed MCP Tool Set

The edge worker exposes a strict JSON-RPC MCP gateway at `/mcp`. Claude clients communicate over HTTP streams, calling these 5 core tools:

| Tool Name | Input Parameters | Action |
|---|---|---|
| `read_wiki_page` | `relativePath` | Fetches raw markdown text from a KV key |
| `write_wiki_page` | `relativePath`, `category`, `content` | Writes or modifies a node in the cloud KV store |
| `search_wiki` | `query` | Runs a text query across all active files, returning context excerpts |
| `list_backlinks` | `pageName` | Identifies all graph nodes referencing the target page |
| `ingest_clipping` | `clippingName` | Streams a raw transcript and returns parsing prompts to assist ingestion |

---

## 📁 Project Directory Map

```text
Company-Brain_usingMCP/
├── .obsidian/               # Local Obsidian vault visualization config
├── my-wiki-mcp/             # Auto-generated Cloudflare build/telemetry directory
├── public/                  # Backup static folder assets
├── src/
│   └── index.ts             # Core Worker script: routes, graph compilation, MCP tools
├── wiki/                    # The Semantic Knowledge Vault
│   ├── concepts/            # Rules, logic structures, and 3-way matching constraints
│   ├── entities/            # Vendor files, stakeholder roles, and system profiles
│   ├── raw/clippings/       # Input space for web clips and raw communication logs
│   └── synthesis/           # Master index layouts and cross-source strategic roadmaps
├── CLAUDE.md                # Master LLM schema: folder rules, naming conventions, ingestion protocols
├── package.json             # Node dependency definitions
├── sync.js                  # Upload script: pushes local vault assets to Cloudflare KV
└── wrangler.toml            # Cloudflare deployment manifest: worker config and KV binding
```

### The Ingestion Blueprint (`CLAUDE.md`)

The single most critical file in the system. It provides explicit, hard-coded operating rules for the AI agent — exact folder scopes, a mandatory lowercase-hyphenated naming convention, and step-by-step ingestion protocols for analyzing unverified raw records.

---

## 🚀 Deployment Guide

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- Wrangler CLI: `npm install -g wrangler`

### 1. Provision the KV Database

Authenticate Wrangler and spin up a global KV namespace:

```powershell
# Authenticate session
npx wrangler login

# Create production KV bucket
npx wrangler kv namespace create WIKI_DATA
```

Copy the returned `id` string and paste it into `wrangler.toml` under the `[[kv_namespaces]]` table:

```toml
[[kv_namespaces]]
binding = "WIKI_DATA"
id = "YOUR_KV_NAMESPACE_ID_HERE"
```

### 2. Synchronize Your Markdown Vault

Push your local knowledge files to the global edge network:

```powershell
node sync.js
```

### 3. Deploy the Worker

Push your TypeScript router live to your Cloudflare subdomain:

```powershell
npx wrangler deploy
```

---

## 🔌 Connecting Claude Clients

Once deployed, your worker exposes a live MCP endpoint accessible by any MCP-ready client.

### Claude Desktop

Add your edge route to the local config file at:
- **macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "company-brain": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/client-cli",
        "https://my-wiki-mcp.YOUR_SUBDOMAIN.workers.dev/mcp"
      ]
    }
  }
}
```

> ⚠️ **Security Note:** Always inject your `X-Wiki-Token` secret into request headers when establishing client connections. Never hardcode tokens in your config file — use environment variables or a secrets manager.

### Claude Code

```bash
claude mcp add company-brain \
  --transport http \
  https://my-wiki-mcp.YOUR_SUBDOMAIN.workers.dev/mcp
```

---

## 🔒 Security Considerations

- The `X-Wiki-Token` header must be validated on every incoming request in `index.ts`. Unauthenticated requests should return `401 Unauthorized`.
- Rotate your token via Cloudflare Worker Secrets, not via `wrangler.toml`:
  ```powershell
  npx wrangler secret put WIKI_TOKEN
  ```
- The `write_wiki_page` tool should be restricted to trusted agents only. Consider a separate token or role check for write operations.
- KV namespaces are globally distributed — ensure no PII or regulated financial data (beyond invoice metadata) is stored without encryption at rest.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push and open a Pull Request

---

## 📄 License

MIT — see `LICENSE` for details.
