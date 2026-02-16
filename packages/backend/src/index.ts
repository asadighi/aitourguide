import "./env.js"; // Load .env before anything else
import { createApp } from "./app.js";

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";

const app = createApp();

app.listen(Number(PORT), HOST, () => {
  console.log(`[backend] server running on http://${HOST}:${PORT}`);
});

