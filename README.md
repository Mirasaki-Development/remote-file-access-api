<p align="center"><img src=".github/markdown-media/logo.png" alt="NaviFS Logo" height="60" style="border-radius:50px"/></p>
<h1 align="center">NaviFS</h1>

<div align='center'>

[![CodeFactor](https://www.codefactor.io/repository/github/Mirasaki-Development/navi-fs/badge)](https://www.codefactor.io/repository/github/Mirasaki-Development/navi-fs)
![GitHub](https://img.shields.io/github/license/Mirasaki-Development/navi-fs)
![GitHub release](https://img.shields.io/github/v/release/Mirasaki-Development/navi-fs)

</div>

<p align="center">
  NaviFS (short for Navigate File System) transforms your local files into a secure, powerful API.
  Stream, serve, and execute using simple configuration and REST-style access.
</p>

## 🔨 Installation

### 📦 Run as a Docker container (preferred)

The quickest, and easiest, way to host/use this application is by deploying it inside of a [Docker](https://www.docker.com/) container. We recommend [Docker Desktop](https://www.docker.com/products/docker-desktop/).

1. Download the [latest release](https://github.com/Mirasaki-Development/navi-fs/releases`) or `git clone git@github.com:Mirasaki-Development/navi-fs.git` the repo
2. Run `npm run setup:linux` or `npm run setup:windows` (depending on your OS) in the project root folder
3. Edit the newly created `/config.yaml` file and provide your configuration
4. Start the application: `docker compose up -d` (you can view logs with `docker compose logs -f`)

### 🖥️ Run as a plain NodeJS app

1. Install the additional pre-requisites:
   - [Node.js](https://nodejs.org/en/) v16.6.0 or newer
2. Download the [latest release](https://github.com/Mirasaki-Development/navi-fs/releases`) or `git clone git@github.com:Mirasaki-Development/navi-fs.git` the repo
3. Run `npm run setup:linux` or `npm run setup:windows` in the project root folder
4. Edit the newly created `/config.yaml` file and provide your configuration
5. Start the application: `npm run start` for production, and `npm run dev` for local development

## ⚙️ Configuration

The configuration for this project can be found [here](/config.example.yaml), and should be very straight-forward. Please see below for "advanced" usage examples.

```yaml
port: 9000 # Port to run the application on
log-level: info # debug, info, warn, or error

# Master API key (must be strong, unique, and kept secret)
master-api-key: "a7fd8324d81e45a99e33b1c9a77ddca1c97f04a4e9aafb2ffb9273b7713ce1cb"

# List of resources to expose via the API
resources:
  - slug: project-files
    target: /home/navi/projects/my-site
    extensions:
      - .html
      - .css
      - .js
    size-policy:
      - unit: bytes
        limit: 1048576  # 1 MB
        mode: truncate
        cumulative: false
        extensions: [".log", ".txt"]
        pattern: ".*\\.log$"
    cache-control:
      max-age: 3600
      s-maxage: 7200
      no-cache: false
      no-store: false
      stale-while-revalidate: 86400
      stale-if-error: 604800
      public: true
      private: false
      immutable: false
    permissions:
      - type: [read, write]
        api-key: "6cbf9926bc7c4ea49ad0ffcb3a6d31e103eb8c7209c69df173bfe1f5f90aa9a3"

  - slug: run-script
    target: /usr/local/bin/scripts
    executable:
      command: "bash"
      args: ["hello-world.sh"]
      cwd: "/usr/local/bin/scripts"
      env:
        MODE: "production"
      inject-current-env: true
      timeout: 300
      detached: false
      shell: "/bin/bash"
    permissions:
      - type: execute
        api-key: "4fa02b5dcfe84f2694ef7cbb6a198a3a94bd6b3e3f4696845edb4a983be70c26"

  - slug: config-json
    target: /etc/myapp/config.json
    extensions:
      - .json
    permissions:
      - type: read
        api-key: "79b29829cebf4b65bb63ff51cdbeaad4f9b8e59aee93e2e5b709b2ef943f3468"
```
## 📚 API Documentation

NaviFS exposes a RESTful API to interact with your local files via secure endpoints.

All requests must include a valid `x-api-key` header.

---

### 🔐 Authentication

There are two types of API keys:

- **Master API Key** – Grants access to list all available slugs.
- **Per-Resource API Key** – Grants access to specific actions on a specific resource.

---

### 🌐 Endpoints

#### `GET /`

Basic health check. No authentication required.

**Response:**

```json
{
  "data": {
    "status": "alive"
  }
}
```

## 📂 `GET /api/v1/:slug`

Retrieves file contents or lists directory contents.

**Query Parameters:**

- `cursor` – Subpath relative to resource root.
- `type` – Output format: `stream`, `json`, `text`, `html`, `xml`, `csv`, `yaml`, `toml`
- `recursive` – If `true`, list all nested files.

**Headers:**

- `x-api-key: <RESOURCE_API_KEY>`

**Behavior:**

- If resource is a file: streams file or parses to requested format.
- If directory: lists contents (recursively if requested).
- Sets `Cache-Control`, `ETag`, `Last-Modified` headers.
- Responds `304` if `If-Modified-Since` or `If-None-Match` headers match.

**Response:**

```json
{
  "data": "...",  // string or list
  "meta": {
    "slug": "logs/system",
    "query": { ... }
  }
}
```

---

## 📥 `POST /api/v1/:slug`

Writes to a file.

**Query Parameters:**

- `cursor` – Path of file to write to.
- `encoding` – Optional, e.g. `utf-8`, `base64`, etc.

**Headers:**

- `Content-Type: text/plain`
- `x-api-key: <RESOURCE_API_KEY>`

**Body:**  
Plain string content to be written to file.

**Behavior:**

- Only works if target is a file.
- Responds with `400` if request body is invalid.

**Response:**  
`201 Created` on success.

---

## 🗑️ `DELETE /api/v1/:slug`

Deletes a file or directory.

**Query Parameters:**

- `cursor` – Path to target file or directory.
- `force` – Required to delete directories.

**Headers:**

- `x-api-key: <RESOURCE_API_KEY>`

**Behavior:**

- Deletes file directly.
- If target is a directory, requires `force=true`.

**Response:**  
`204 No Content` on success.

---

## 🧠 `EXECUTE /api/v1/:slug`

Executes a command via SSE (Server-Sent Events).

**Query Parameters:**

- `cursor` – Optional execution path override.

**Headers:**

- `Accept: text/event-stream`
- `x-api-key: <RESOURCE_API_KEY>`

**Behavior:**

- Only allowed for resources marked `"executable": true`.
- Streams `stdout`, `stderr`, `exit`, and `error` events.

**Response Format (SSE):**

```json
event: stdout
data: Hello from stdout

event: stderr
data: Warning: something happened

event: exit
data: Process exited with code 0
```

---

## 🧪 `HEAD /api/v1/:slug`

Returns basic info and cache headers.

**Headers:**

- `x-api-key: <RESOURCE_API_KEY>`

**Behavior:**

- Sets `Cache-Control` based on resource configuration.
- Returns `200 OK`.

---

## ⚙️ `OPTIONS /api/v1/:slug`

Returns allowed methods.

**Response Headers:**

```json
Allow: HEAD, OPTIONS, GET, POST, DELETE, EXECUTE
```

---

### ⚠️ Error Handling

All errors return a consistent format:

```json
{
  "error": {
    "code": "BAD_REQUEST" | "NOT_FOUND" | "METHOD_NOT_ALLOWED" | "INTERNAL_ERROR",
    "message": "Human-readable error message",
    "details": {
      "slug": "...",
      "query": { ... },
      "error": "Optional extra error string"
    }
  }
}
```

> In development mode, error messages may include stack traces or exception details.

## 🤝 Contributing

We welcome contributions of all kinds! Whether it's fixing a bug, improving documentation, suggesting a new feature, or helping with tests — every bit helps make NaviFS better for everyone.

To contribute: (Please note the project is in an early stage, and currently doesn't have any tests set-up - any PRs for this are appreciated!)

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** and ensure existing tests pass
3. If applicable, add tests for your changes
4. **Submit a pull request** with a clear description of your work

Before submitting, please review our [Code of Conduct](./CODE_OF_CONDUCT.md) and [Contribution Guidelines](./CONTRIBUTING.md) (coming soon).

> Found a bug or have an idea? Open an issue — let’s talk!

## ⭐ Credits and Attribution

- Logo by [Flaticon](https://www.flaticon.com/free-icons/distance-education)

<br />

> Open source, self-hosted, and [Free Culture licensed](https://creativecommons.org/share-your-work/public-domain/freeworks), meaning you're in full control.

<br />

<p align="center"><a href="https://github.com/Mirasaki-Development/navi-fs#navi-fs"><img src="http://randojs.com/images/backToTopButton.png" alt="Back to top" height="29"/></a></p>
