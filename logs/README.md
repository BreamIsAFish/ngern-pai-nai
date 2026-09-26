# AI response logs

Debug builds send raw AI provider responses to the local Vite development server. The server writes the latest 10 responses to `ai-responses.jsonl`, including a UTC timestamp, provider, model, HTTP status, and request ID.

The generated log is ignored by Git because receipt responses may contain personal or financial information. Release builds do not send these logs.
