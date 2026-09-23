import "dotenv/config";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleUpload } from "./upload";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const port = Number(process.env.PORT) || 5173;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer(async (req, res) => {
  // 1. API: Upload endpoint
  if (req.url === "/api/upload" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        console.log("Menerima request upload foto...");
        const data = JSON.parse(body);
        const rawBase64 = data.raw.replace(/^data:image\/\w+;base64,/, "");
        const overlayBase64 = data.overlay.replace(
          /^data:image\/\w+;base64,/,
          "",
        );

        const rawBuffer = Buffer.from(rawBase64, "base64");
        const overlayBuffer = Buffer.from(overlayBase64, "base64");

        const result = await handleUpload(rawBuffer, overlayBuffer);
        console.log("Upload ke R2 sukses:", result.overlayDownloadUrl);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Upload error:", message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: message }));
      }
    });
    return;
  }

  // 2. Serve static files from dist
  const urlPath = req.url?.split("?")[0] || "/";
  let filePath = path.join(distDir, urlPath === "/" ? "index.html" : urlPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, "index.html");
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found (build dist first with pnpm run build)");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`RAISA Photobooth Server jalan di http://localhost:${port}`);
});
