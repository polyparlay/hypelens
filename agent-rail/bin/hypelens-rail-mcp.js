#!/usr/bin/env node
import { main } from '../src/mcp.js';
main().catch((e) => { console.error('hypelens-rail-mcp fatal:', e); process.exit(1); });
