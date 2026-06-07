# Technical Architecture & Stack

* **Frontend:** React SPA deployed on Vercel, utilizing TailwindCSS for UI layout.
* **Backend Monolith:** Node.js Express API hosted on standard AWS EC2 legacy server blocks. This computing overhead directly conflicts with our cost-reduction targets in [[Company-Context]].
* **Database/Storage:** Single primary PostgreSQL instance hosting all customer order transactions.
* **Third-Party Integrations:** Shopify REST API, Twilio (for SMS alerts), Slack Webhooks.
* **Known Technical Debt & Bottlenecks:**
  * Our single PostgreSQL database is heavily throttled. When 50 storefronts send updates at the same time, the database CPU spikes to 98% and queries stall. This directly limits our ability to scale [[Project-Specification]].
  * The current forecasting logic is written as a heavy, monolithic JavaScript loop that blocks the main single thread when processing large customer datasets. This processing lag heavily magnifies the data synchronization errors described in [[Market-And-Risks]].