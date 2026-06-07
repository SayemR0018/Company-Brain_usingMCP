import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root wiki path (where the folder trees live)
const WIKI_DIR = path.join(__dirname, "wiki");

// Ensure directory safety
async function getMarkdownFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
          // Exclude hidden folders like .git or .vscode
          if (entry.name.startsWith(".")) return [];
          return getMarkdownFiles(res);
        }
        return entry.name.endsWith(".md") ? res : [];
      })
    );
    return files.flat();
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}: ${error.message}`);
    return [];
  }
}

// Wrapper to run the Wrangler KV put child process
function uploadToKV(key, filePath) {
  return new Promise((resolve, reject) => {
    // Dynamically inject the standard Node.js path for Windows
    const nodePath = "C:\\Program Files\\nodejs";
    const customPath = `${nodePath}${path.delimiter}${process.env.PATH || ""}`;

    // On Windows, npx is a batch script and must be invoked as npx.cmd
    const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

    const configPath = path.resolve(__dirname, "..", "my-wiki-mcp", "wrangler.toml");

    // Prepare arguments
    const args = [
      "wrangler",
      "kv",
      "key",
      "put",
      `--config="${configPath}"`,
      "--binding=WIKI",
      key,
      `--path="${filePath}"`,
      "--remote"
    ];

    // Spawn wrangler command safely
    const child = spawn(npxCmd, args, {
      env: {
        ...process.env,
        PATH: customPath
      },
      shell: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(
            `Exit code ${code}.\nStdout: ${stdout.trim()}\nStderr: ${stderr.trim()}`
          )
        );
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

// Primary execution pipeline
async function main() {
  console.log("=========================================");
  console.log("⚡ CLOUDFLARE KV WIKI SYNCHRONIZER ⚡");
  console.log("=========================================");
  console.log(`📂 Scanning wiki path: ${WIKI_DIR}`);

  // 1. Gather all markdown files recursively
  const mdFiles = await getMarkdownFiles(WIKI_DIR);
  const totalFiles = mdFiles.length;

  if (totalFiles === 0) {
    console.log("⚠️ No markdown (.md) files found in the wiki folder tree.");
    console.log("=========================================");
    return;
  }

  console.log(`🔍 Located ${totalFiles} markdown file(s) for sync.`);
  console.log("-----------------------------------------");

  let successCount = 0;
  let failureCount = 0;

  // 2. Process sequentially to prevent overloading resources and avoid Cloudflare API rate limits
  for (let i = 0; i < totalFiles; i++) {
    const filePath = mdFiles[i];
    const fileIndex = i + 1;

    try {
      // 3. Compute relative path and sanitize into KV Key: 'wiki:folder:filename'
      const relativePath = path.relative(WIKI_DIR, filePath);
      const ext = path.extname(relativePath);
      const relativeWithoutExt = relativePath.slice(0, -ext.length);
      
      // Normalize separators to forward slash first, then replace with colons
      const normalizedPath = relativeWithoutExt.replace(/\\/g, "/");
      const kvKey = `wiki:${normalizedPath.replace(/\//g, ":")}`;

      console.log(`[${fileIndex}/${totalFiles}] Syncing KV key: '${kvKey}'...`);

      // 4. Read text payload for verification and logging size
      const content = await fs.readFile(filePath, "utf-8");
      console.log(`   (Read payload size: ${content.length} characters)`);

      // 5. Upload to KV via robust --path parameter to avoid shell newline issues
      await uploadToKV(kvKey, filePath);
      
      console.log(`   ✅ Success!`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to sync file: ${path.basename(filePath)}`);
      console.error(`      Error: ${error.message}`);
      failureCount++;
    }
    console.log("-----------------------------------------");
  }

  // Final summary statistics
  console.log("=========================================");
  console.log("✨ SYNCHRONIZATION PIPELINE FINISHED ✨");
  console.log(`🎉 Successfully Uploaded: ${successCount}`);
  console.log(`❌ Failed Uploads: ${failureCount}`);
  console.log("=========================================");
}

main().catch((error) => {
  console.error("❌ Fatal synchronization pipeline error:", error);
  process.exit(1);
});
