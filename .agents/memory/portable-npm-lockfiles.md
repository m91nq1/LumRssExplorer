---
name: Portable npm lockfiles
description: An environment-specific package-install behavior that can break external builds
---

After dependency installation, check that lockfile tarball URLs remain reachable
from external hosting, even when the project's `.npmrc` uses the public registry.

**Why:** The Replit package-install callback reintroduced private
`package-firewall.replit.internal` resolved URLs despite a public registry
configuration. A successful workspace install did not establish Render
installability.

**How to apply:** Before delivering dependency changes intended for Render,
inspect resolved URL hosts and validate with a clean public-registry install.
Preserve package integrity hashes and avoid unrelated version changes. This is
portability verification, not permission to bypass a security block.
