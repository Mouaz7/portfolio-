# Git history rewrite runbook

History rewriting is a separately approved maintenance event. It is never run
by CI and must not be mixed with ordinary feature commits.

## Locked order

1. Freeze pushes and record the current remote refs.
2. Create and checksum a private backup containing tracked, untracked and
   binary worktree files. Keep credentials out of manifests and logs.
3. Create a mirror clone from the remote and scan all owner-controlled refs
   with pinned Gitleaks plus `scripts/scan-git-history.sh`.
4. Revoke and rotate every confirmed or reasonably potentially exposed
   credential before declaring cleanup successful.
5. Search author/committer metadata, commit messages, annotated tags, notes,
   blobs and other published objects for the address that must be removed.
6. Run `git-filter-repo` in a disposable mirror, save old-to-new ref and commit
   mappings privately, and verify the rewritten object graph before any push.
7. Obtain separate human approval for an atomic, exact-ref
   `--force-with-lease` push. Never disable protection or widen the push scope
   implicitly.
8. Clone the rewritten remote afresh, rerun both scanners and the address
   search, then restore reviewed worktree changes into that clone.
9. Configure the verified GitHub noreply identity before creating new commits.
10. Create risk-separated pull requests, run Quality on rewritten `main`, and
    verify the production deployment. Repository publication is a separate,
    explicitly approved release and is not part of this private-repo cleanup.

## Object-integrity rules

- When only author/committer metadata or commit messages change, file trees
  must remain byte-identical.
- Commit-message and annotated-tag changes create new object IDs but do not by
  themselves change file content.
- If a blob must be sanitized, record the changed blob IDs, tree IDs and all
  affected descendant commit IDs.
- Inventory signed tags. Re-sign or remove a changed signed tag only after an
  explicit owner decision.
- Use `git fsck --full --strict` and tree comparisons as part of the dry-run
  evidence.

## Output and residual risk

Scanner output is redacted and may contain only finding type, ref/object ID and
path. It must never print a credential value. Gitleaks is the primary general
scanner; the project script is a complementary control for repository-specific
patterns and metadata.

Only objects reachable through refs controlled by the repository owner can be
guaranteed rewritten. Old clones, forks, GitHub-generated pull-request refs
and caches may retain old objects. If a post-rewrite scan finds another
credential, revoke and rotate it first, perform a targeted new rewrite, and
obtain new force-push approval.

## Current maintenance evidence (2026-09-14)

- The private worktree backup was checksum-verified before rewrite work.
- Gitleaks found no credential leak in 66 locally reachable commits. Before
  the rewrite, the complementary release gate found the student address in 21
  commit objects on owner-controlled refs.
- The disposable rewrite produced `main` at
  `cf067b805056012ca2dca8c69a280b4a53ee96eb` and
  `fix/responsive-skills-scale` at
  `8e5e6a75ddece2c670d4ebd3c29f4b827f9741ce`. All 16 rewritten commit trees
  matched their source trees, `git fsck --full --strict` passed, and the latest
  project-specific scanner passed 16 commits and 407 blobs with zero findings.
- An earlier approved exact-ref atomic force-push was rejected by protected
  `main`. Atomicity preserved both remote refs: remote `main` remains
  `61dd9cac959341266985d07d19e4d5d275e4638f`, and remote
  `fix/responsive-skills-scale` remained
  `d8e6c6c6570112dff0547532d50c70ee29b5b5a7`.

That failed attempt changed neither remote ref. The later successful
maintenance operation is recorded below.

## Fresh offline verification (2026-09-19)

- A new private, checksum-verified worktree backup covers 348 present tracked
  and untracked files, the Git status, binary diff and base commit. A verified
  copy is stored in the restricted `/root/portfolio-release-backups` directory,
  outside Git. This is local storage, not an off-machine recovery copy.
- The fresh remote mirror has exactly `main` and
  `fix/responsive-skills-scale`, at the same old SHAs recorded above. The
  project-specific scanner found 15 redacted student-address commit findings
  in those published refs. Pinned Gitleaks scanned 16 commits and found no
  leaks. The local-only ref set has 21 student-address findings.
- An independent offline `git-filter-repo` run produced the same new ref SHAs
  recorded above. All 16 old/new commit pairs have identical tree IDs;
  `git fsck --full --strict` passed. Both scanners passed on the rewritten
  mirror (16 commits and 407 blobs for the project-specific scanner).
- The old/new ref inventories and commit map are checksummed in the private
  mirror workspace. This paragraph records the pre-push dry-run; post-push
  evidence follows.

## Completed maintenance and fresh-clone verification (2026-09-19)

- GitHub CLI was authenticated as repository owner `Mouaz7` with Admin
  permission. The separate GitHub app could not administer branch protection,
  so the already-authorized owner CLI was used without adding broader app
  permissions.
- Before the push, remote had exactly two branch refs at the documented old
  SHAs. The offline rewrite and both scanners were rechecked.
- Only `allowsForcePushes` on the classic `main` protection rule was enabled
  temporarily. After rechecking remote refs, exactly those two refs were pushed
  in one atomic transaction with explicit `--force-with-lease` expectations.
  No plain `--force` was used.
- `allowsForcePushes` was immediately restored to `false`; all other
  protection fields matched the pre-operation snapshot. The rule still
  enforces administrators, linear history and resolved conversations and
  blocks branch deletion. No repository ruleset existed.
- A new mirror cloned directly from GitHub has exactly two branches, no tags
  and 16 reachable commits. All mapped commit IDs are present and their trees
  are byte-identical to the old commits. `git fsck --full --strict`, pinned
  Gitleaks and the project scanner all passed. The latter checked 407 blobs
  with no student-address or credential findings.
- The existing private working-copy backup remains outside Git. Ordinary
  release PRs, credential-provider checks and manual approval gates are
  separate from this completed history maintenance event.
