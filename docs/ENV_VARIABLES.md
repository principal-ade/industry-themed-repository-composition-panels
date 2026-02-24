# Environment Variables Documentation

The Package Composition Panel can display environment variable documentation from your repository. This helps developers understand what configuration is required to run the project.

## Supported File Formats

The panel detects these files in order of preference:

| File               | Format | Description                            |
| ------------------ | ------ | -------------------------------------- |
| `env.json`         | JSON   | Structured format with full metadata   |
| `.env.schema.json` | JSON   | Alternative name for structured format |
| `.env.example`     | Dotenv | Standard dotenv with comment parsing   |
| `.env.sample`      | Dotenv | Alternative name for dotenv format     |

## env.json Format

The recommended format for comprehensive documentation:

```json
{
  "variables": [
    {
      "name": "DATABASE_URL",
      "description": "PostgreSQL connection string",
      "required": true,
      "default": "postgresql://localhost:5432/mydb",
      "example": "postgresql://user:pass@host:5432/db",
      "group": "Database",
      "link": "https://www.postgresql.org/docs/current/libpq-connect.html"
    }
  ]
}
```

### Fields

| Field         | Type    | Required | Description                                         |
| ------------- | ------- | -------- | --------------------------------------------------- |
| `name`        | string  | Yes      | Environment variable name (e.g., `DATABASE_URL`)    |
| `description` | string  | No       | Human-readable description                          |
| `required`    | boolean | No       | Whether the variable must be set (default: `false`) |
| `default`     | string  | No       | Default value if not set                            |
| `example`     | string  | No       | Example value for documentation                     |
| `group`       | string  | No       | Category for grouping related variables             |
| `link`        | string  | No       | URL to relevant documentation                       |

## .env.example Format

Standard dotenv format with enhanced comment parsing:

```bash
# === Database ===

# PostgreSQL connection string
# https://www.postgresql.org/docs/current/libpq-connect.html
# required
DATABASE_URL=

# Redis URL for caching
REDIS_URL=redis://localhost:6379

# === Server ===

# Port to run the server on
PORT=3000

# Enable debug logging
DEBUG=false
```

### Comment Conventions

#### Descriptions

Comments directly above a variable become its description:

```bash
# This becomes the description
MY_VAR=value
```

Multiple comment lines are joined:

```bash
# First line of description
# Second line of description
MY_VAR=value
```

#### Required Flag

Mark a variable as required with any of these patterns:

```bash
# required
MY_VAR=

# (required)
MY_VAR=

# Database URL (required)
MY_VAR=
```

#### Groups / Section Headers

Group related variables using section headers:

```bash
# === Section Name ===
VAR1=value

## Section Name
VAR2=value

# [Section Name]
VAR3=value
```

All variables after a section header belong to that group until the next header.

#### Links

URLs in comments are automatically detected:

```bash
# Get your API key at https://example.com/api-keys
# required
API_KEY=
```

The first URL found in the comments becomes the variable's link.

#### Default Values

Values after `=` are treated as defaults:

```bash
# Server port
PORT=3000
```

## UI Display

### Tabs

When environment documentation exists, an "Env" tab appears in the Package Composition Panel after the Dependencies tab.

### Grouping

Variables are displayed in groups when the `group` field is set:

- Named groups appear first, sorted alphabetically
- Ungrouped variables appear at the end
- Each group has a header with the group name

### Variable Display

Each variable shows:

- **Name** - The variable name in monospace
- **Link icon** - Clickable external link (if `link` is set)
- **Badge** - "required" (red) or "optional" (green)
- **Default** - The default value (if set)
- **Description** - Below the name row

## Examples

### Minimal env.json

```json
{
  "variables": [
    { "name": "API_KEY", "required": true },
    { "name": "DEBUG", "default": "false" }
  ]
}
```

### Full-featured env.json

```json
{
  "variables": [
    {
      "name": "DATABASE_URL",
      "description": "PostgreSQL connection string for the main database",
      "required": true,
      "example": "postgresql://user:pass@localhost:5432/mydb",
      "group": "Database",
      "link": "https://www.postgresql.org/docs/current/libpq-connect.html"
    },
    {
      "name": "REDIS_URL",
      "description": "Redis connection URL for caching and sessions",
      "required": true,
      "default": "redis://localhost:6379",
      "group": "Database",
      "link": "https://redis.io/docs/connect/"
    },
    {
      "name": "PORT",
      "description": "Port number for the HTTP server",
      "default": "3000",
      "group": "Server"
    },
    {
      "name": "LOG_LEVEL",
      "description": "Logging verbosity (debug, info, warn, error)",
      "default": "info",
      "group": "Server"
    },
    {
      "name": "STRIPE_API_KEY",
      "description": "Stripe API key for payment processing",
      "required": true,
      "group": "Payments",
      "link": "https://dashboard.stripe.com/apikeys"
    }
  ]
}
```

### Full-featured .env.example

```bash
# === Database ===

# PostgreSQL connection string for the main database
# https://www.postgresql.org/docs/current/libpq-connect.html
# required
DATABASE_URL=

# Redis connection URL for caching and sessions
# https://redis.io/docs/connect/
# required
REDIS_URL=redis://localhost:6379

# === Server ===

# Port number for the HTTP server
PORT=3000

# Logging verbosity (debug, info, warn, error)
LOG_LEVEL=info

# === Payments ===

# Stripe API key for payment processing
# https://dashboard.stripe.com/apikeys
# required
STRIPE_API_KEY=
```
