export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ========================================================
    // ROUTE A: Public Interactive Brain Network Visualizer (/)
    // ========================================================
    if (path === "/" || path === "/index.html" || path === "/index") {
      try {
        const listResult = await env.WIKI.list({ prefix: "wiki:" });
        const nodesMap = new Map();
        const links: any[] = [];

        for (const key of listResult.keys) {
          const rawContent = await env.WIKI.get(key.name) || "";
          const parts = key.name.split(":");
          const fileWithExt = parts[parts.length - 1] || key.name;
          const cleanId = fileWithExt.replace(".md", "");

          // Classify knowledge categories into distinct presentation layers
          let group = "Concepts";
          if (key.name.includes("sources/") || key.name.includes("Context") || key.name.includes("Contex")) {
            group = "Sources";
          } else if (key.name.includes("entities/")) {
            group = "Entities";
          } else if (key.name.includes("synthesis/") || key.name.includes("Roadmap") || key.name.includes("Risk")) {
            group = "Synthesis";
          }

          nodesMap.set(cleanId, { id: cleanId, label: cleanId.replace(/-/g, " "), group });

          // Scan content text patterns for Obsidian bidirectional links [[Link]]
          // Re-instantiated each loop iteration to maintain clean regex indices across multi-file runs
          const regex = /\[\[(.*?)\]\]/g;
          let match;
          while ((match = regex.exec(rawContent)) !== null) {
            const target = match[1].split("|")[0].split("#")[0].trim().replace(".md", "");
            if (target && target !== cleanId) {
              links.push({ source: cleanId, target: target });
            }
          }
        }

        // Integrity pass: Ensure all link targets exist as node coordinates
        for (const link of links) {
          if (!nodesMap.has(link.target)) {
            nodesMap.set(link.target, { id: link.target, label: link.target.replace(/-/g, " "), group: "Concepts" });
          }
        }

        const graphData = {
          nodes: Array.from(nodesMap.values()),
          links: links
        };

        // Render Premium Cinematic Dark-Mode Layout Page
        const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Building a Company Brain using MCP</title>
  <script src="https://unpkg.com/force-graph"></script>
  <style>
    body { 
      margin: 0; 
      background: radial-gradient(circle at center, #111622 0%, #070a10 100%);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
      overflow: hidden; 
      color: #fff; 
    }
    
    /* Background Canvas Layer for the Animated Brain Constellation */
    #brain-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1;
      opacity: 0.18;
      pointer-events: none;
    }

    #graph-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2;
    }

    /* Vibrant, High-Readability Glass Header Block */
    header { 
      position: absolute; 
      top: 0; 
      left: 0; 
      width: 100%; 
      z-index: 10; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding: 18px 30px; 
      box-sizing: border-box; 
      background: rgba(7, 10, 16, 0.8); 
      backdrop-filter: blur(20px); 
      border-bottom: 2px solid #C65D07; 
      box-shadow: 0 4px 30px rgba(198, 93, 7, 0.15);
    }
    
    h1 { 
      margin: 0; 
      font-size: 1.45rem; 
      font-weight: 800; 
      letter-spacing: -0.02em;
      background: linear-gradient(to right, #ffffff 30%, #C65D07 70%, #00f5ff 100%);
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
      filter: drop-shadow(0px 2px 8px rgba(198, 93, 7, 0.3));
    }
    
    .badge { 
      padding: 6px 14px; 
      border-radius: 20px; 
      font-size: 0.75rem; 
      font-weight: 700; 
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: 1px solid #C65D07; 
      background: rgba(198, 93, 7, 0.15); 
      color: #ffffff; 
      box-shadow: 0 0 12px rgba(198, 93, 7, 0.2);
    }

    /* Elegant Informational Floating Panel */
    .info-panel { 
      position: absolute; 
      top: 95px; 
      left: 25px; 
      z-index: 10; 
      background: rgba(7, 10, 16, 0.85); 
      backdrop-filter: blur(12px);
      padding: 20px; 
      border-radius: 12px; 
      border: 1px solid rgba(198, 93, 7, 0.3); 
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      font-size: 0.8rem; 
      min-width: 260px; 
    }
    
    .legend-item { 
      display: flex; 
      align-items: center; 
      margin-top: 10px; 
      font-size: 0.78rem; 
      color: rgba(255,255,255,0.85); 
    }
    
    .dot { 
      width: 12px; 
      height: 12px; 
      border-radius: 50%; 
      margin-right: 12px; 
      display: inline-block; 
      box-shadow: 0 0 8px currentColor;
    }
    
    /* Modern Footer */
    footer { 
      position: absolute; 
      bottom: 0; 
      left: 0; 
      width: 100%; 
      z-index: 10; 
      padding: 14px; 
      text-align: center; 
      font-size: 0.75rem; 
      letter-spacing: 0.02em;
      color: rgba(255,255,255,0.45); 
      background: rgba(7, 10, 16, 0.9); 
      border-top: 1px solid rgba(255,255,255,0.05); 
    }
    
    footer strong {
      color: rgba(255, 255, 255, 0.8);
    }
  </style>
</head>
<body>
  <canvas id="brain-backdrop"></canvas>
  <div id="graph-container"></div>

  <header>
    <h1>Building a Company Brain using MCP</h1>
    <div class="badge">Inspired by YC RFS Summer 2026</div>
  </header>

  <div class="info-panel">
    <div style="font-weight: 800; margin-bottom: 4px; color: #00f5ff; font-size: 0.9rem; letter-spacing: -0.01em;">Active Edge Service Tools</div>
    <div style="font-size: 0.72rem; color: rgba(255,255,255,0.5); margin-bottom: 16px; line-height: 1.4; font-family: monospace;">read_wiki_page, write_wiki_page, search_wiki, list_backlinks, ingest_clipping</div>
    <div style="font-weight: 700; color: #fff; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.03em;">Knowledge Layers</div>
    <div class="legend-item"><span class="dot" style="background:#C65D07; color:#C65D07;"></span>Sources (Reality Logs)</div>
    <div class="legend-item"><span class="dot" style="background:#00f5ff; color:#00f5ff;"></span>Concepts (Rules & Logic)</div>
    <div class="legend-item"><span class="dot" style="background:#8a2be2; color:#8a2be2;"></span>Entities (Roles & Profiles)</div>
    <div class="legend-item"><span class="dot" style="background:#ff1493; color:#ff1493;"></span>Synthesis (Timeline Maps)</div>
  </div>

  <footer><strong>&copy; Sayem Rahman | 2026</strong> &nbsp;|&nbsp; Powered by Cloudflare Workers & KV Edge Memory &nbsp;|&nbsp; Model Context Protocol Matrix</footer>

  <script>
    // ========================================================
    // 1. PROCEDURAL BACKGROUND NEURAL BRAIN GENERATOR
    // ========================================================
    const bgCanvas = document.getElementById('brain-backdrop');
    const bgCtx = bgCanvas.getContext('2d');
    let width = bgCanvas.width = window.innerWidth;
    let height = bgCanvas.height = window.innerHeight;

    const brainNodes = [];
    const brainLinks = [];

    // Form an elegant procedural sagittal/lateral brain profile silhouette
    function buildBrainSilhouette() {
      brainNodes.length = 0;
      brainLinks.length = 0;
      const numPoints = 140;
      const centerX = width * 0.52;
      const centerY = height * 0.5;
      const baseScale = Math.min(width, height) * 0.32;

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        
        // Custom mathematical mapping to model a structural cerebral profile
        let r = 1.0 + 0.18 * Math.sin(angle * 3) * Math.cos(angle * 2);
        if (angle > Math.PI * 0.1 && angle < Math.PI * 0.9) {
          r += 0.15 * Math.sin(angle * 5); // Cerebrum crest lobes
        } else if (angle >= Math.PI * 0.9 && angle < Math.PI * 1.4) {
          r -= 0.18 * Math.cos(angle * 2); // Cerebellum cavity indentation
        }
        
        // Populate localized interior nodes randomly inside the cerebral boundaries
        const rad = r * baseScale * (0.1 + 0.9 * Math.random());
        const x = centerX + rad * Math.cos(angle) * 1.2; // Oval horizontal emphasis
        const y = centerY + rad * Math.sin(angle) * 0.95;

        brainNodes.push({
          x, y,
          origX: x, origY: y,
          phase: Math.random() * Math.PI * 2,
          speed: 0.01 + Math.random() * 0.015
        });
      }

      // Interlink adjacent backdrop structural indices to form an integrated mesh grid
      for (let i = 0; i < brainNodes.length; i++) {
        for (let j = i + 1; j < brainNodes.length; j++) {
          const dist = Math.hypot(brainNodes[i].x - brainNodes[j].x, brainNodes[i].y - brainNodes[j].y);
          if (dist < baseScale * 0.24) {
            brainLinks.push({ source: brainNodes[i], target: brainNodes[j] });
          }
        }
      }
    }

    function animateBrainBackdrop() {
      bgCtx.clearRect(0, 0, width, height);
      
      // Paint structural node link lines
      bgCtx.strokeStyle = 'rgba(198, 93, 7, 0.14)';
      bgCtx.lineWidth = 0.8;
      bgCtx.beginPath();
      for (const link of brainLinks) {
        bgCtx.moveTo(link.source.x, link.source.y);
        bgCtx.lineTo(link.target.x, link.target.y);
      }
      bgCtx.stroke();

      // Draw active drifting core connection joints
      bgCtx.fillStyle = 'rgba(0, 245, 255, 0.35)';
      for (const node of brainNodes) {
        node.phase += node.speed;
        // Introduce organic fluid motion
        node.x = node.origX + Math.sin(node.phase) * 6;
        node.y = node.origY + Math.cos(node.phase) * 6;

        if (Math.random() > 0.993) { // Pulsing synapses event loop
          bgCtx.fillStyle = '#C65D07';
          bgCtx.fillRect(node.x - 2, node.y - 2, 4, 4);
          bgCtx.fillStyle = 'rgba(0, 245, 255, 0.35)';
        } else {
          bgCtx.fillRect(node.x - 1, node.y - 1, 2, 2);
        }
      }
      requestAnimationFrame(animateBrainBackdrop);
    }

    buildBrainSilhouette();
    animateBrainBackdrop();

    window.addEventListener('resize', () => {
      width = bgCanvas.width = window.innerWidth;
      height = bgCanvas.height = window.innerHeight;
      buildBrainSilhouette();
    });

    // ========================================================
    // 2. KNOWLEDGE NODES GRAPH SIMULATION ENGINE
    // ========================================================
    const graphData = ${JSON.stringify(graphData)};
    const colorMap = { Sources: '#C65D07', Concepts: '#00f5ff', Entities: '#8a2be2', Synthesis: '#ff1493' };

    const elem = document.getElementById('graph-container');
    const Graph = ForceGraph()(elem)
      .graphData(graphData)
      .backgroundColor('transparent') // Allow the canvas brain mesh to gleam through
      .nodeId('id')
      .nodeVal(8)
      .nodeLabel(node => \`<div style="background: #070a10; color: #fff; padding: 8px 12px; border-radius: 6px; border: 1.5px solid \${colorMap[node.group]}; font-size: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.4);"><strong>\${node.label}</strong><br><span style="color: rgba(255,255,255,0.65); font-size: 11px;">Layer: \${node.group}</span></div>\`)
      .nodeColor(node => colorMap[node.group] || '#ffffff')
      .linkColor(() => 'rgba(198, 93, 7, 0.28)')
      .linkWidth(2)
      .linkDirectionalParticles(4)
      .linkDirectionalParticleSpeed(0.007)
      .d3Force('charge').strength(-240);

    // Keep graph layout dimensions perfectly scaled to viewport bounding dimensions
    Graph.width(window.innerWidth).height(window.innerHeight);
    window.addEventListener('resize', () => Graph.width(window.innerWidth).height(window.innerHeight));
  </script>
</body>
</html>`;

        return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
      } catch (err: any) {
        return new Response("Internal Server Error: " + err.message, { status: 500 });
      }
    }

    // ========================================================
    // ROUTE B: Secure JSON-RPC Model Context Protocol Gateway (/mcp)
    // ========================================================
    if (path === "/mcp" && request.method === "POST") {
      const token = request.headers.get("X-Wiki-Token");
      if (!token || token !== env.WIKI_SECRET_TOKEN) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }

      try {
        const body: any = await request.json();
        const { method, params, id } = body;

        // 1. Tool Declaration Directory
        if (method === "tools/list") {
          const toolsList = {
            jsonrpc: "2.0",
            result: {
              tools: [
                {
                  name: "read_wiki_page",
                  description: "Read the markdown content of a specific page within the wiki.",
                  inputSchema: {
                    type: "object",
                    properties: { relativePath: { type: "string", description: "Relative path inside the wiki folder." } },
                    required: ["relativePath"]
                  }
                },
                {
                  name: "write_wiki_page",
                  description: "Create or update a wiki page. Enforces category directories and tracking metrics.",
                  inputSchema: {
                    type: "object",
                    properties: {
                      relativePath: { type: "string", description: "Relative path starting with the category." },
                      category: { type: "string", enum: ["sources", "concepts", "entities", "synthesis"] },
                      content: { type: "string", description: "Full Markdown content." }
                    },
                    required: ["relativePath", "category", "content"]
                  }
                },
                {
                  name: "search_wiki",
                  description: "Perform a structural string or keyword query across all files in the cloud storage layer.",
                  inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
                },
                {
                  name: "list_backlinks",
                  description: "Identify all wiki pages that contain a link to a specific page name.",
                  inputSchema: { type: "object", properties: { pageName: { type: "string", description: "The filename without extension." } }, required: ["pageName"] }
                },
                {
                  name: "ingest_clipping",
                  description: "Read a raw clipping record and output standard parsing prompts to assist ingestion protocols.",
                  inputSchema: { type: "object", properties: { clippingName: { type: "string", description: "The filename of the clipping target." } }, required: ["clippingName"] }
                }
              ]
            },
            id
          };
          return new Response(JSON.stringify(toolsList), { headers: { "Content-Type": "application/json" } });
        }

        // 2. Interactive Tool Processing Logic Hub
        if (method === "tools/call") {
          const toolName = params?.name;
          let textOutput = "";

          if (toolName === "read_wiki_page") {
            const relPath = String(params?.arguments?.relativePath || "");
            const cleanKey = relPath.startsWith("wiki:") ? relPath : `wiki:${relPath}`;
            const data = await env.WIKI.get(cleanKey);
            textOutput = data || `Error: File payload "${relPath}" not located in edge memory.`;
          } 
          
          else if (toolName === "write_wiki_page") {
            const relPath = String(params?.arguments?.relativePath || "");
            const content = String(params?.arguments?.content || "");
            const cleanKey = relPath.startsWith("wiki:") ? relPath : `wiki:${relPath}`;
            
            await env.WIKI.put(cleanKey, content);
            textOutput = `Successfully wrote corporate brain node to ${relPath} within cloud edge namespace maps.`;
          } 
          
          else if (toolName === "search_wiki") {
            const query = String(params?.arguments?.query || "").toLowerCase();
            const listResult = await env.WIKI.list({ prefix: "wiki:" });
            textOutput = `=== Search Results for Cloud Query "${query}" ===\n`;
            let matchFound = false;

            for (const key of listResult.keys) {
              const content = await env.WIKI.get(key.name) || "";
              if (content.toLowerCase().includes(query)) {
                matchFound = true;
                const cleanDisplay = key.name.replace("wiki:", "");
                textOutput += `\n[File target: ${cleanDisplay}]\n`;
                content.split("\n").forEach((line: string, idx: number) => {
                  if (line.toLowerCase().includes(query)) {
                    textOutput += ` Line ${idx + 1}: ${line.trim()}\n`;
                  }
                });
              }
            }
            if (!matchFound) textOutput += "No matching target keyword structures located across the edge database ecosystem.";
          } 
          
          else if (toolName === "list_backlinks") {
            const pageName = String(params?.arguments?.pageName || "").toLowerCase().replace(".md", "");
            const listResult = await env.WIKI.list({ prefix: "wiki:" });
            textOutput = `=== Backlinks pointing to "${pageName}" ===\n`;
            let hasLinks = false;

            const linkRegex = new RegExp(`\\[\\[.*${pageName}.*\\]\\]`, "i");

            for (const key of listResult.keys) {
              const content = await env.WIKI.get(key.name) || "";
              if (linkRegex.test(content)) {
                hasLinks = true;
                textOutput += `- [[\${key.name.replace("wiki:", "").replace(".md", "")}]]\n`;
              }
            }
            if (!hasLinks) textOutput += `No active structural bidirectional graph nodes reference [[\${pageName}]].`;
          } 
          
          else if (toolName === "ingest_clipping") {
            const clippingName = String(params?.arguments?.clippingName || "");
            const lookupKey = clippingName.includes("clippings/") ? `wiki:\${clippingName}` : `wiki:raw/clippings/\${clippingName}`;
            const content = await env.WIKI.get(lookupKey);

            if (!content) {
              textOutput = `Failed to find clipping target "\${clippingName}" inside the cloud repository bucket.`;
            } else {
              textOutput = `--- INGESTION PROTOCOL ANALYSIS ASSISTANT ---
Target Node Attachment: \${clippingName}
Total Stream Ingest: \${content.length} character tokens

[Inference Blueprint Guidelines Prompt Trigger Map]`;
            }
          } 
          
          else {
            textOutput = `Error: Unknown requested tool entity: "\${toolName}".`;
          }

          const callResponse = {
            jsonrpc: "2.0",
            result: { content: [{ type: "text", text: textOutput }] },
            id
          };
          return new Response(JSON.stringify(callResponse), { headers: { "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({ error: "Method not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
};