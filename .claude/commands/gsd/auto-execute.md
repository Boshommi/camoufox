---
name: gsd:auto-execute
description: Autonomously plan and execute all plans in a phase using subagents
argument-hint: "<phase-number>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---

<objective>
Autonomously execute an entire phase with minimal user intervention.

Uses subagents heavily:
- One subagent for planning (if no plans exist)
- One subagent per plan execution (sequential)
- Main context only orchestrates (~10-15% usage)

Checkpoint handling:
- Verify checkpoints: batched at end of phase
- Decision checkpoints: pause, present to user, resume after choice
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/auto-execute.md
@./.claude/get-shit-done/workflows/execute-phase.md
@./.claude/get-shit-done/workflows/plan-phase.md
</execution_context>

<context>
Phase number: $ARGUMENTS

**Load project state:**
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/config.json
</context>

<process>

<step name="validate">
**Validate inputs and project state:**

1. Check .planning/ directory exists (error if not)
2. Parse phase number from $ARGUMENTS
3. Validate phase exists in ROADMAP.md
4. Find phase directory path

```bash
ls .planning/phases/ | grep "^${PHASE}-" | head -1
```

If phase directory doesn't exist, create it based on ROADMAP.md phase name.
</step>

<step name="check_plans">
**Determine current state:**

```bash
# Count plans and summaries
ls .planning/phases/${PHASE_DIR}/*-PLAN.md 2>/dev/null | wc -l
ls .planning/phases/${PHASE_DIR}/*-SUMMARY.md 2>/dev/null | wc -l
```

**Routing:**
- IF no PLAN.md files exist → Go to planning_subagent
- ELSE → Go to checkpoint_scan
</step>

<step name="planning_subagent">
**Spawn subagent to create plans:**

Use Task tool with subagent_type="general-purpose":

```
prompt: "Execute the /gsd:plan-phase workflow for phase {phase-number}.

You have fresh context. Your job is to:
1. Read .planning/STATE.md, ROADMAP.md, PROJECT.md
2. Follow .claude/get-shit-done/workflows/plan-phase.md
3. Create all PLAN.md files for this phase
4. Commit plans with: docs({phase}): create phase plans

When complete, report back with:
- plans_created: number of plans
- plan_files: list of {path, objective, has_decision_checkpoint, has_verify_checkpoint}
- any planning decisions made

Do NOT execute the plans - only create them."
```

Wait for subagent completion.
Parse response to get list of created plans.
Continue to checkpoint_scan.
</step>

<step name="checkpoint_scan">
**Analyze plans for checkpoints:**

For each PLAN.md without matching SUMMARY.md:

```bash
# Check for decision checkpoints
grep -l "checkpoint:decision" .planning/phases/${PHASE_DIR}/*-PLAN.md 2>/dev/null

# Check for verify checkpoints
grep -l "checkpoint:human-verify" .planning/phases/${PHASE_DIR}/*-PLAN.md 2>/dev/null
```

**Report scan results:**

```
════════════════════════════════════════
GSD Auto-Execute: Phase {N}
════════════════════════════════════════

Plans: {total} ({complete} complete, {remaining} to execute)

Checkpoint analysis:
  {phase}-01: autonomous
  {phase}-02: 2 verify checkpoints (will batch)
  {phase}-03: 1 decision checkpoint (will pause)
  {phase}-04: autonomous

Estimated interruptions: {N} decision checkpoint(s)

Starting execution...
════════════════════════════════════════
```
</step>

<step name="execution_loop">
**Execute plans sequentially via subagents:**

Initialize tracking state:
- verify_batch = []
- commit_log = []
- start_time = now()

FOR each plan in remaining_plans (sorted by plan number):

  **1. Spawn execution subagent:**

  Use Task tool with subagent_type="general-purpose":

  ```
  prompt: "Execute the plan at {plan_path}

  You have fresh context. Follow the execute-phase workflow at
  .claude/get-shit-done/workflows/execute-phase.md

  Key steps:
  1. Read STATE.md and plan context files
  2. Execute each task with atomic commits (one commit per task)
  3. Handle deviations per rules 1-5
  4. Create SUMMARY.md
  5. Update STATE.md position
  6. Commit metadata: docs({phase}-{plan}): complete [name] plan

  SPECIAL CHECKPOINT HANDLING:
  - For checkpoint:human-verify: DO NOT pause. Record the verification
    item (what_built, how_to_verify) and continue. Include in your report.
  - For checkpoint:decision: STOP immediately. Return with status='decision_needed'
    and include the full decision details (question, options, context).

  When done, report back with JSON-like structure:
  ---REPORT---
  status: complete | decision_needed | failed
  commits: [list of {hash, message}]
  verify_items: [list of {plan, what_built, how_to_verify}]
  duration: execution time in seconds
  decision_details: (only if status=decision_needed) {question, options[], context}
  error: (only if status=failed) error description
  ---END_REPORT---"
  ```

  **2. Wait for subagent completion**

  **3. Process result:**

  Parse the ---REPORT--- section from subagent response.

  **IF status == 'complete':**
  - Append verify_items to verify_batch
  - Append commits to commit_log
  - Display progress:
    ```
    [{phase}-{plan}] ████████████ Complete ({duration})
            → {commit_message_1}
            → {commit_message_2}
    ```
  - Continue to next plan

  **IF status == 'decision_needed':**
  - Display decision checkpoint:
    ```
    ════════════════════════════════════════
    CHECKPOINT: Decision Required
    ════════════════════════════════════════

    Plan: {phase}-{plan}
    {decision_question}

    Options:
    {formatted_options}

    ════════════════════════════════════════
    ```
  - Use AskUserQuestion to get decision
  - Spawn NEW subagent to continue from checkpoint with decision:
    ```
    prompt: "Continue executing plan at {plan_path}

    User decided: {decision_choice}

    Resume from the task AFTER the decision checkpoint.
    The decision checkpoint has been resolved.

    Complete remaining tasks, create SUMMARY.md, update STATE.md.

    Report back with same format as before."
    ```
  - Process continuation result
  - Continue to next plan

  **IF status == 'failed':**
  - Display error
  - Use AskUserQuestion:
    - header: "Plan Failed"
    - question: "Plan {phase}-{plan} failed: {error}. How to proceed?"
    - options:
      - "Retry" - Spawn fresh subagent to retry
      - "Skip" - Mark incomplete, continue to next plan
      - "Abort" - Stop auto-execute, preserve progress

END FOR
</step>

<step name="batch_verification">
**Present all collected verifications:**

IF verify_batch is not empty:

```
════════════════════════════════════════
VERIFICATION CHECKLIST
════════════════════════════════════════

Phase {N} complete. Please verify:

{for each item in verify_batch}
[ ] [{plan}] {what_built}
    {how_to_verify}
{end for}

All items verified?
════════════════════════════════════════
```

Use AskUserQuestion:
- header: "Verify"
- question: "Review the {N} verification items above. All verified?"
- options:
  - "All verified" - Continue to completion
  - "Issues found" - Log issues and suggest /gsd:plan-fix

IF "Issues found":
- Ask user to describe issues
- Create {phase}-ISSUES.md with reported issues
- Suggest: `/gsd:plan-fix {phase}`
</step>

<step name="completion_report">
**Display final summary:**

```
════════════════════════════════════════
PHASE {N} COMPLETE
════════════════════════════════════════

Duration: {total_duration}
Plans executed: {executed}/{total}

Commits ({commit_count} total):
  {hash_1} {message_1}
  {hash_2} {message_2}
  {hash_3} {message_3}
  ... ({remaining} more)

Verifications: {verified_status}

---

Next steps:
- /gsd:auto-execute {N+1} - Continue to next phase
- /gsd:progress - Review project status
- /gsd:verify-work {N} - Detailed acceptance testing

════════════════════════════════════════
```
</step>

</process>

<error_handling>
| Scenario | Action |
|----------|--------|
| No .planning/ dir | Error: "Run /gsd:new-project first" |
| Invalid phase number | Error: "Phase {N} not found in ROADMAP.md" |
| Subagent timeout | Kill, report partial progress, offer retry/skip/abort |
| Task verification fails | Subagent reports failure, main offers retry/skip/abort |
| Git conflict | Stop, instruct manual resolution, offer resume |
| All plans already complete | Report "Phase already complete", suggest next phase |
</error_handling>

<success_criteria>
- [ ] Planning subagent creates plans (if needed)
- [ ] Each plan executed via dedicated subagent
- [ ] Verify checkpoints collected and batched at end
- [ ] Decision checkpoints handled inline with user
- [ ] All commits tracked and reported
- [ ] Phase completion reported with summary
- [ ] Next steps offered
</success_criteria>
