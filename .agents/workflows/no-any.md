---
description: Avoid using 'any' in the codebase
---

// turbo-all
1. NEVER use the 'any' type in TypeScript.
2. Always provide specific types for variables, component props, and function arguments.
3. If a type is dynamic or unknown, use 'Record<string, unknown>', 'Record<string, any>' is also forbidden.
4. If accessing an object with dynamic keys (like Convex 'Doc' or GAME_PARAMS), cast it to a specific Record type like 'Record<string, { pts: number, perc: number }>' instead of 'any'.
5. Use 'unknown' instead of 'any' if the type is truly unknown, and then use type guards.
