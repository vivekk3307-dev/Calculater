# Day Planner

A student- and work-friendly daily planner with a calendar, timed tasks, an AI coach, focus timer, goals, habit check-ins, daily reflection, and a local PDF reading corner. Planner and growth records are stored in your browser; PDF files are stored in IndexedDB on this device.

The interface adapts from narrow mobile screens through tablets and desktop monitors, including a compact calendar and mobile-friendly navigation.

## Run locally

Requires Node.js 18 or newer.

1. Copy `.env.example` to `.env`.
2. Add your own OpenAI API key to `.env`. Keep this file private and never commit or share it.
3. Run `node server.js` from this folder.
4. Open `http://127.0.0.1:3000`.

The API key is read by the local Node server; it is never sent to or stored in the browser. The AI coach sends the question and the current day's task, goal, habit, focus, and reflection context to OpenAI. Avoid entering sensitive personal information. AI suggestions are not automatically added to your planner.

Without a configured key, the planner and growth tools still work; the AI coach will explain that setup is required.

## Reading corner

Drop one or more PDF books into the Reading corner or choose them with the file picker. PDFs up to 100 MB are kept locally in this browser's IndexedDB and are never uploaded to the AI service. Open a book in the embedded PDF reader, start/pause the reading timer, and update the current page manually as you read. Choose a daily minutes goal to track reading time and pages in the recent history. Removing a book deletes its local PDF but keeps its reading history.
