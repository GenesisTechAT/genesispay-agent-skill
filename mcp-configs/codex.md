# Codex

One command:

```bash
codex mcp add genesispay --env GENESISPAY_AGENT_KEY=gp_ag_your_key --env GENESISPAY_BASE_URL=https://your-genesispay-instance.example -- npx -y @genesis-tech/genesispay-mcp@1.8.0
```

Or declare it yourself in `~/.codex/config.toml`:

```toml
[mcp_servers.genesispay]
command = "npx"
args = ["-y", "@genesis-tech/genesispay-mcp@1.8.0"]
env = { GENESISPAY_AGENT_KEY = "gp_ag_your_key", GENESISPAY_BASE_URL = "https://your-genesispay-instance.example" }
```

Restart Codex afterwards; it reads the config at startup.

## The skill

Codex has no `.claude/skills` directory, so give it the same instructions the
other way it takes them — `AGENTS.md` at your project root:

```bash
cat SKILL.md >> AGENTS.md
```

Strip the YAML frontmatter (the `---` block at the top) if you paste it by hand;
it is Claude-specific and means nothing here. Everything below it — when to pay,
how to handle `pending_approval`, and above all how to handle `unresolved` —
is what stops an agent paying twice for one thing, and it is worth having
verbatim rather than summarised.

## Verify it is connected

```bash
codex mcp list
```

Then ask for something that needs the tools:

```txt
What can my GenesisPay agent wallet spend right now?
```

That should call `genesispay_account` and come back with a wallet address, a
balance and the caps your policy sets. If it answers from memory instead, the
server is not connected.
