# GitHub Actions integration

`oss-launch-lint` can be used as a CI quality gate with:

- `--fail-under <score>` to fail when launch readiness drops below a threshold.
- `--github-step-summary` to append the Markdown report to the Actions job summary.
- `--output -` to print the Markdown report to stdout.

## Current source-checkout usage

Until the package is published to npm, install the CLI from the GitHub source repository in the runner temp directory:

```yaml
name: Launch readiness

on:
  pull_request:
  push:
    branches: [main]

jobs:
  launch-readiness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - name: Install oss-launch-lint from source
        run: |
          git clone --depth 1 https://github.com/sjh9714/oss-launch-lint.git "$RUNNER_TEMP/oss-launch-lint"
          npm ci --prefix "$RUNNER_TEMP/oss-launch-lint"
          npm run build --prefix "$RUNNER_TEMP/oss-launch-lint"
      - run: node "$RUNNER_TEMP/oss-launch-lint/bin/oss-launch-lint" "$GITHUB_WORKSPACE" --fail-under 80 --github-step-summary --no-promotion
```

## Package-published usage

After npm publishing is approved and completed, other repositories can use:

```yaml
name: Launch readiness

on:
  pull_request:
  push:
    branches: [main]

jobs:
  launch-readiness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npx oss-launch-lint@latest . --fail-under 80 --github-step-summary --no-promotion
```

Start with a low threshold, then raise it as the repository matures. A score gate should help maintainers catch launch gaps, not block urgent fixes for cosmetic reasons.
