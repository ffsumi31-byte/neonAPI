# ApiDuck Claude Code connectors

These scripts launch the already-installed Claude Code CLI against
`https://apiduh.netlify.app`. They ask for an individual `sk-gw-…` customer key
using hidden input and do not save it. They never contain DeepSeek/OpenRouter
provider credentials.

The API service must be enabled and operational first. In particular, the
Netlify function needs its server-only `DEEPSEEK_API_KEY`, `DATABASE_URL`, and
validated quota configuration. If hosted inference is disabled or the account
database is unavailable, the service cannot return completions.

The hosted route currently supports Claude Messages only. This is not a native
installer and does not include Claude Code; install the official CLI separately.

## Windows

Extract `apiduck-windows.zip`, open PowerShell in the project directory you want
Claude Code to work in, and run:

```powershell
& "C:\path\to\Start-ApiDuck.ps1"
```

Pass Claude Code options after the script path if needed.

## Linux

Extract `apiduck-linux.tar.gz`, open a terminal in your project directory, then:

```bash
bash /path/to/start-apiduck.sh
```

Pass Claude Code options after the script path if needed.
