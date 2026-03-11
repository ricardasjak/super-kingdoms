---
description: Avoid using alert() for UI messages
---

# UI Messaging Rules

When building or updating features, **NEVER** use browser `alert()` or `confirm()` dialogs to display success or error messages to the user, except on Admin pages.

Instead, always use local component state (like React `useState`) to render inline success or error messages directly within the UI layout (e.g., using small alert boxes, colored text, or toast notifications). 

## Example (What to do):
```tsx
const [successMsg, setSuccessMsg] = useState<string | null>(null);
const [errorMsg, setErrorMsg] = useState<string | null>(null);

// Inside render:
{errorMsg && <p style={{ color: "var(--pico-del-color)" }}>{errorMsg}</p>}
{successMsg && <p style={{ color: "var(--pico-ins-color)" }}>{successMsg}</p>}
```

## Exception:
If the file path includes `/admin/` or is explicitly an admin tool, you may use standard `alert()` for speed of development.
