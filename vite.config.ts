import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleUpload } from "./server/upload";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      {
        name: "api-upload",
        configureServer(server) {
          server.middlewares.use("/api/upload", (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end("Method Not Allowed");
              return;
            }

            let body = "";
            req.on("data", (chunk: Buffer) => {
              body += chunk.toString();
            });
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const rawBase64 = data.raw.replace(
                  /^data:image\/\w+;base64,/,
                  "",
                );
                const overlayBase64 = data.overlay.replace(
                  /^data:image\/\w+;base64,/,
                  "",
                );

                const rawBuffer = Buffer.from(rawBase64, "base64");
                const overlayBuffer = Buffer.from(overlayBase64, "base64");

                const result = await handleUpload(rawBuffer, overlayBuffer);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (err: unknown) {
                const message =
                  err instanceof Error ? err.message : String(err);
                console.error("Upload error:", message);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: message }));
              }
            });
          });
        },
      },
    ],
    server: {
      host: true,
      port: 5173,
    },
    build: {
      outDir: "dist",
    },
  };
});
