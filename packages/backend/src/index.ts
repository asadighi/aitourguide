import "./env.js"; // Load .env before anything else
import { createApp } from "./app.js";

const PORT = process.env.PORT || 4000;

const app = createApp();

app.listen(PORT, () => {
  console.log(`[backend] server running on http://localhost:${PORT}`);
});

