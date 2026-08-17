# AI Usage Declaration

In line with the assignment's AI policy, all AI-generated material was **reviewed, understood and
tested** by the author before being accepted. Nothing is merged that the author cannot explain.

## 1. How AI was used

| Area | AI assistance | Human role |
|---|---|---|
| Project scaffolding | Suggested folder structure matching the required layout | Reviewed against assignment spec, adjusted |
| Backend code | Drafted config/security/RBAC/services/routers patterns | Reviewed line by line, corrected flaws (e.g., roles-in-token risk R-01, generic login errors R-02), renamed/reshaped to own design |
| Frontend code | Drafted React pages and API client | Reviewed, simplified, wired to actual endpoints |
| Documentation | Drafted the 16 required docs + READMEs | Verified every statement against the running system and test results |
| Tests | Drafted test cases from the threat model | Executed, diagnosed failures (weekend date offsets R-13), fixed assertions |

## 2. What was NOT delegated to AI

- Understanding of the security model (author can walk through every permission check and token flow)
- Acceptance decisions (all code and docs approved only after personal review and passing tests)
- The demonstration walkthrough

## 3. Verification performed on AI output

1. Full backend test suite executed: 51/51 passed.
2. Dependency scan executed on the final pinned set.
3. Manual end-to-end walkthrough of successful and denied workflows (root README script).

## 4. Known limitations of AI assistance

AI cannot guarantee absence of vulnerabilities; therefore the threat model, STRIDE analysis and
security tests were authored to challenge the AI-generated code, and findings were fed back through
the remediation log (remediation.md).
