# GitHub repository hardening handoff

Package identity in this checkout is `mouaz-naji-portfolio`. Renaming the
GitHub repository is an owner-level external action and must complete before
changing clone URLs, badges, workflow links or the Git remote. Suggested
repository name: `mouaz-naji-portfolio`.

After owner authentication, verify rather than assume each setting:

1. Rename the repository in GitHub settings and confirm GitHub's redirect from
   the old repository URL.
2. Update `origin`, README clone/badge links, scheduled-sync allowlists and any
   Vercel Git connection. Search the full tree for `portfolio-` afterward.
3. Enable GitHub secret scanning and push protection. Pinned Gitleaks is the
   general history scanner; the project-specific script complements it with
   repository-specific metadata and credential patterns.
4. Verify that the existing workflow and GitHub Code Security settings really
   constitute the intended advanced CodeQL setup. If advanced setup is kept,
   disable Default setup and prove that only one JavaScript/TypeScript analysis
   is produced for each commit.
5. Require successful CodeQL for the exact published `main` commit. Read the
   exact Quality and CodeQL status-check names from the first successful public
   runs and exercise them in a test pull request before locking the ruleset.
6. Protect `main`: require pull requests, one CODEOWNER approval, the verified
   Quality and CodeQL checks, conversation resolution, no force pushes, no
   deletion, and administrator enforcement.
7. Confirm Dependabot can open npm and GitHub Actions update pull requests.

Save timestamped evidence for repository visibility, published commit SHA,
CodeQL mode and run, exact required check names, secret scanning, push
protection, ruleset behavior and fork pull-request permissions. Fork pull
requests must receive read-only permissions and no repository, environment or
deployment secrets. Mark unsupported or unverified controls as blocked rather
than passed.

Do not publish merely because automated checks pass. The pull-request template
requires a human to approve the proprietary/publicly-visible license intent,
asset licences, code provenance and any new visual baseline. Git history
rewriting or secret rotation is a separate, explicitly approved incident task;
never run it as part of routine hardening.

Any temporary history-rewrite exception must be removed before the final
ruleset check. Old clones, forks, GitHub-generated pull-request refs and cached
objects may retain old objects even after owner-controlled public refs are
rewritten.

## Authenticated pre-publication snapshot (2026-09-14)

The owner-authenticated API currently reports repository `Mouaz7/portfolio-`
as private with `main` as its default branch. Secret scanning and code scanning
are disabled, no repository ruleset exists, and recent conditional CodeQL runs
are skipped while the repository is private. This confirms that the workflow
file exists; it does not yet prove the intended advanced setup is active.

Classic protection on `main` currently enforces administrators and resolved
conversations and blocks force-push and deletion. It does not yet require pull
requests or status checks. That protection also rejected the separately
approved atomic history-rewrite push, so both remote refs remained unchanged.
Any temporary owner-approved rewrite exception must be narrow and removed
again before publication.

These are verified pre-publication facts, not completion of the post-visibility
gate. Requery every control after publication and bind required checks only to
the exact names observed on the first successful public Quality and CodeQL
runs.
