---
type: concept
title: "KV Sync Verification"
tags: [testing, cloudflare]
---

# KV Sync Verification

This is a test file used to verify that the `sync.js` Node.js automation script correctly:
1. Recursively finds this file inside `wiki/concepts/`.
2. Sanitizes the path `wiki/concepts/test-sync.md` into the KV key signature `wiki:concepts:test-sync`.
3. Invokes the Wrangler KV put command to upload this content.
