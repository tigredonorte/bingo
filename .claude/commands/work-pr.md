# Work PR Command

Updates PR description and adds visual documentation for a Jira task. Uses SHA tracking to skip if already up-to-date.

## Usage

```
/work-pr <ticket-id> [--force]
```

**Examples:**
- `/work-pr APPSUPEN-856`
- `/work-pr 856`
- `/work-pr 856 --force` (regenerate regardless of SHA)

## Instructions

### Step 0: Pre-flight Memory Check

**CRITICAL:** Check for zombie Claude processes before spawning subagents.

```bash
echo "═══════════════════════════════════════════════════════════"
echo "  PRE-FLIGHT CHECK: Memory & Process Status"
echo "═══════════════════════════════════════════════════════════"

# Check available memory
FREE_MEM=$(free -m | awk '/^Mem:/{print $7}')
echo "Available memory: ${FREE_MEM}MB"

if [ "$FREE_MEM" -lt 4000 ]; then
  echo "⚠️  LOW MEMORY WARNING: Only ${FREE_MEM}MB available (need 4GB+)"
  echo ""
  echo "Top memory consumers:"
  ps aux --sort=-%mem | head -6
  echo ""
  echo "❌ ABORTING: Insufficient memory to spawn subagents safely."
  echo "   Kill zombie processes or free memory before retrying."
  exit 1
fi

# Check for zombie Claude processes (older than current session)
# More precise matching: claude binary or node running claude
CURRENT_PID=$$
ZOMBIE_CLAUDES=$(ps aux | grep -E '[c]laude\s+(code|chat|api)|node.*[c]laude' | awk -v pid="$CURRENT_PID" '$2 != pid && $10 > "00:30:00" {printf "  PID %s: %s CPU, %.0fMB RAM, running %s\n", $2, $3"%", $6/1024, $10}')

if [ -n "$ZOMBIE_CLAUDES" ]; then
  echo ""
  echo "⚠️  ZOMBIE CLAUDE PROCESSES DETECTED:"
  echo "$ZOMBIE_CLAUDES"
  echo ""
  echo "These long-running processes may cause heap allocation errors."
  echo "Consider killing them: kill -9 <PID>"
  echo ""
fi

echo "✅ Pre-flight check passed"
echo ""
```

### Step 1: Setup variables

```bash
TICKET_ID="APPSUPEN-XXX"  # From args, prefix if needed
FORCE_MODE=false         # Set to true if --force flag passed
TASKS_DIR="/home/node/worktrees/tasks/${TICKET_ID}"
PR_SHA_FILE="${TASKS_DIR}/.pr-update-sha"
POST_PR_SHA_FILE="${TASKS_DIR}/.post-pr-update-sha"
CURRENT_SHA=$(git rev-parse HEAD)

# Ensure tasks folder exists
mkdir -p "$TASKS_DIR"

# Force mode overrides SHA checks
if [ "$FORCE_MODE" = "true" ]; then
  echo "🔄 FORCE MODE: Will regenerate all regardless of SHA"
fi
```

### Step 2: Check if pr-generator is needed

```bash
LAST_PR_SHA=""
if [ -f "$PR_SHA_FILE" ]; then
  LAST_PR_SHA=$(cat "$PR_SHA_FILE" 2>/dev/null || echo "")
fi

echo "═══════════════════════════════════════════════════════════"
echo "  PR UPDATE CHECK: ${TICKET_ID}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Current HEAD:     $CURRENT_SHA"
echo "Last PR update:   ${LAST_PR_SHA:-"(none)"}"
echo ""

if [ "$FORCE_MODE" = "true" ]; then
  echo "🔄 Force mode - will run pr-generator"
  PR_NEEDS_UPDATE=true
elif [ "$CURRENT_SHA" = "$LAST_PR_SHA" ]; then
  echo "✅ PR description up-to-date - SKIPPING pr-generator"
  PR_NEEDS_UPDATE=false
else
  echo "📝 Changes detected - will run pr-generator"
  PR_NEEDS_UPDATE=true
fi
```

### Step 3: Run pr-generator (if needed)

**Only if PR_NEEDS_UPDATE=true:**

First, push any unpushed commits:
```bash
if ! git push; then
  echo "❌ Failed to push commits. Aborting."
  echo "   Check network, auth, or branch protection settings."
  exit 1
fi
echo "✅ Commits pushed successfully"
```

Then run pr-generator:
```
Task(pr-generator):
  Update PR for current branch with implementation details.
  Jira ticket: ${TICKET_ID}
  Status: Implementation complete, all checks passing

  IMPORTANT: After completion, confirm success by outputting:
  "PR_UPDATE_RESULT: SUCCESS" or "PR_UPDATE_RESULT: FAILED"
```

Record the SHA **only on success**:
```bash
# Only record SHA if pr-generator confirmed success
# The agent should verify the Task result before running this
echo "$CURRENT_SHA" > "$PR_SHA_FILE"
echo "✅ PR updated. Recorded SHA: $CURRENT_SHA"
```

### Step 4: Check if pr-post-generator is needed

```bash
LAST_POST_PR_SHA=""
if [ -f "$POST_PR_SHA_FILE" ]; then
  LAST_POST_PR_SHA=$(cat "$POST_PR_SHA_FILE" 2>/dev/null || echo "")
fi

echo ""
echo "Post-PR Generator Check:"
echo "  Current HEAD:        $CURRENT_SHA"
echo "  Last post-PR update: ${LAST_POST_PR_SHA:-"(none)"}"
echo ""

if [ "$FORCE_MODE" = "true" ]; then
  echo "🔄 Force mode - will run pr-post-generator"
  POST_PR_NEEDS_UPDATE=true
elif [ "$CURRENT_SHA" = "$LAST_POST_PR_SHA" ]; then
  echo "✅ Post-PR documentation up-to-date - SKIPPING"
  POST_PR_NEEDS_UPDATE=false
else
  echo "📸 Changes detected - will run pr-post-generator"
  POST_PR_NEEDS_UPDATE=true
fi
```

### Step 5: Run pr-post-generator (if needed)

**Only if POST_PR_NEEDS_UPDATE=true:**

```
Task(pr-post-generator):
  Add screenshots and test results to PR if applicable.
  Ticket: ${TICKET_ID}

  IMPORTANT: After completion, confirm success by outputting:
  "POST_PR_UPDATE_RESULT: SUCCESS" or "POST_PR_UPDATE_RESULT: FAILED"
```

Record the SHA **only on success**:
```bash
# Only record SHA if pr-post-generator confirmed success
# The agent should verify the Task result before running this
echo "$CURRENT_SHA" > "$POST_PR_SHA_FILE"
echo "✅ Post-PR updated. Recorded SHA: $CURRENT_SHA"
```

### Step 6: Summary

```bash
# Compute status strings (bash doesn't have ternary)
PR_STATUS="⏭️ Skipped (cached)"
[ "$PR_NEEDS_UPDATE" = "true" ] && PR_STATUS="✅ Updated"

POST_PR_STATUS="⏭️ Skipped (cached)"
[ "$POST_PR_NEEDS_UPDATE" = "true" ] && POST_PR_STATUS="✅ Updated"

echo "═══════════════════════════════════════════════════════════"
echo "  /work-pr COMPLETE: ${TICKET_ID}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Tracking files:"
echo "  .pr-update-sha:      ${PR_SHA_FILE}"
echo "  .post-pr-update-sha: ${POST_PR_SHA_FILE}"
echo ""
echo "Current HEAD: ${CURRENT_SHA}"
echo ""
echo "Status:"
echo "  PR Generator:      $PR_STATUS"
echo "  Post-PR Generator: $POST_PR_STATUS"
```

## When to use

- After `/work` completes implementation and `/check` passes
- To update PR after making additional commits
- To re-run PR generators if they failed previously

## Tracking files

| File | Location | Purpose |
|------|----------|---------|
| `.pr-update-sha` | `tasks/{TICKET}/` | Tracks last pr-generator run |
| `.post-pr-update-sha` | `tasks/{TICKET}/` | Tracks last pr-post-generator run |

## Notes

- Both generators use SHA tracking to skip if unchanged
- Files must exist for `/work` to complete (verified by hook)
- Safe to run multiple times - idempotent
