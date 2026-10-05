# Claude Code

One command:

```bash
claude mcp add genesispay \
  --env GENESISPAY_AGENT_KEY=gp_ag_your_key \
  --env GENESISPAY_BASE_URL=https://your-genesispay-instance.example \
  -- npx -y @genesis-tech/genesispay-mcp@1.8.0
```

Or declare it in `.mcp.json` at your project root (checked in, key via env):

```json
{
  "mcpServers": {
    "genesispay": {
      "command": "npx",
      "args": ["-y", "@genesis-tech/genesispay-mcp@1.8.0"],
      "env": {
        "GENESISPAY_AGENT_KEY": "${GENESISPAY_AGENT_KEY}",
        "GENESISPAY_BASE_URL": "https://your-genesispay-instance.example"
      }
    }
  }
}
```

To install the skill, copy `SKILL.md` from this repo into your project:

```bash
mkdir -p .claude/skills/genesispay-payments
cp SKILL.md .claude/skills/genesispay-payments/SKILL.md
```
