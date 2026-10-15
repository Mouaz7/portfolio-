#!/usr/bin/env bash
set -euo pipefail

# Project-specific complement to Gitleaks. This script deliberately uses only
# high-confidence formats and never prints matched values.
rules=(
  "student-email|[A-Z0-9._%+-]+@student[.]bth[.]se"
  "private-key|-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"
  "github-token|gh[pousr]_[A-Za-z0-9_]{20,}"
  "aws-access-key|AKIA[0-9A-Z]{16}"
  "supabase-secret|sb_secret_[A-Za-z0-9_-]{20,}"
  "nvidia-api-key|nvapi-[A-Za-z0-9_-]{20,}"
  "turnstile-secret|0x[A-Fa-f0-9]{32,}"
  "vercel-token|VERCEL_OIDC_TOKEN[[:space:]]*=[[:space:]]*eyJ[A-Za-z0-9_.-]+"
)

mapfile -t annotated_tags < <(
  git for-each-ref --format='%(objectname) %(objecttype)' refs/tags \
    | awk '$2 == "tag" { print $1 }'
)
mapfile -t published_refs < <(
  git for-each-ref --format='%(refname)' refs/heads refs/remotes refs/tags refs/notes
)
if (( ${#published_refs[@]} == 0 )); then
  printf 'Project history scan failed: no branch, remote, tag or note refs were found.\n' >&2
  exit 1
fi
declare -A seen=()
declare -A scanned_objects=()
finding_count=0
commit_count=0
tag_count=0
blob_count=0

report_finding() {
  local rule="$1"
  local object="$2"
  local object_type="$3"
  local path="${4:-}"
  local key="$rule:$object:$object_type:$path"
  [[ -z "${seen[$key]:-}" ]] || return
  seen[$key]=1
  finding_count=$((finding_count + 1))
  printf 'HISTORY_FINDING rule=%s object=%s type=%s' \
    "$rule" "${object:0:12}" "$object_type" >&2
  if [[ -n "$path" ]]; then
    printf ' path=%s' "$path" >&2
  fi
  printf '\n' >&2
}

scan_object_text() {
  local object="$1"
  local object_type="$2"
  local path="${3:-}"
  local entry rule expression
  for entry in "${rules[@]}"; do
    rule="${entry%%|*}"
    expression="${entry#*|}"
    if git cat-file -p "$object" 2>/dev/null | LC_ALL=C grep -E -i -I -q -- "$expression"; then
      report_finding "$rule" "$object" "$object_type" "$path"
    fi
  done
}

# Scan every unique object reachable from owner-controlled branches, remotes,
# tags and notes. Tool-private checkpoint refs (for example refs/codex) are not
# publishable repository history and are deliberately outside this release gate.
# Raw commit objects include author/committer metadata and messages; blobs
# include ordinary files, Git notes and objects reachable through published refs.
while IFS= read -r object_entry; do
  [[ -n "$object_entry" ]] || continue
  object="${object_entry%% *}"
  path=""
  [[ "$object_entry" == *" "* ]] && path="${object_entry#* }"
  [[ -z "${scanned_objects[$object]:-}" ]] || continue
  scanned_objects[$object]=1

  object_type="$(git cat-file -t "$object" 2>/dev/null || true)"
  case "$object_type" in
    commit)
      commit_count=$((commit_count + 1))
      scan_object_text "$object" "commit"
      ;;
    tag)
      tag_count=$((tag_count + 1))
      scan_object_text "$object" "annotated_tag"
      ;;
    blob)
      blob_count=$((blob_count + 1))
      scan_object_text "$object" "blob" "$path"
      ;;
  esac
done < <(git rev-list --objects "${published_refs[@]}")

# Some Git versions peel annotated tags before the object walk. Include each
# tag object explicitly while retaining the unique-object guard.
for tag_object in "${annotated_tags[@]}"; do
  if [[ -z "${scanned_objects[$tag_object]:-}" ]]; then
    scanned_objects[$tag_object]=1
    tag_count=$((tag_count + 1))
    scan_object_text "$tag_object" "annotated_tag"
  fi
done

if (( finding_count > 0 )); then
  printf 'Project history scan failed: %d redacted high-confidence finding(s). Rotate confirmed credentials before rewriting history.\n' \
    "$finding_count" >&2
  exit 1
fi

printf 'Project history scan passed: %d commits, %d annotated tags and %d blobs scanned, 0 high-confidence findings.\n' \
  "$commit_count" "$tag_count" "$blob_count"
