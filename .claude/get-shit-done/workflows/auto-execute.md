# Auto-Execute Workflow

Detailed reference for the `/gsd:auto-execute` command.

## Purpose

Execute an entire phase autonomously using subagents, with minimal main context usage. Handles planning (if needed), sequential plan execution, checkpoint batching, and progress reporting.

## Architecture

### Subagent Strategy

```
Main Context (Orchestrator) ~10-15% context usage
    │
    ├─► Planning Subagent (if no plans exist)
    │   └─ Fresh 200k context
    │   └─ Creates all PLAN.md files
    │   └─ Returns: plan list with checkpoint types
    │
    ├─► Execution Subagent 1 (Plan XX-01)
    │   └─ Fresh 200k context
    │   └─ Executes tasks, creates SUMMARY
    │   └─ Returns: status, commits, verify items
    │
    ├─► Execution Subagent 2 (Plan XX-02)
    │   └─ Fresh 200k context
    │   └─ If decision checkpoint: returns early
    │   └─ Returns: status, commits, verify items
    │
    └─► ... (sequential, one at a time)
```

### Why Sequential (Not Parallel)

1. **Git history**: Parallel execution would interleave commits confusingly
2. **Dependencies**: Later plans may depend on earlier plan outputs
3. **State**: STATE.md must be updated after each plan
4. **Context**: Each subagent gets full fresh context anyway

### Why Subagents (Not Main Context)

1. **Fresh context**: Each plan starts with 0% context usage
2. **Quality**: No degradation from accumulated context
3. **Isolation**: Subagent failures don't corrupt main state
4. **Scalability**: Can handle phases with many plans

## Checkpoint Handling

### Verify Checkpoints (Batched)

Verify checkpoints (`type="checkpoint:human-verify"`) are collected during execution and presented as a batch at the end of the phase.

**During execution:**
- Subagent records verification item but continues
- Does NOT pause for user verification
- Returns verify items in report

**After all plans complete:**
- Main context presents all verifications as checklist
- User reviews all at once
- If issues found, logged to {phase}-ISSUES.md

**Benefits:**
- Fewer interruptions during execution
- User can verify everything together
- Natural batch review point

### Decision Checkpoints (Inline Pause)

Decision checkpoints (`type="checkpoint:decision"`) require immediate user input because subsequent tasks depend on the choice.

**When encountered:**
1. Subagent stops immediately
2. Returns `status='decision_needed'` with decision details
3. Main context presents decision to user
4. User makes choice via AskUserQuestion
5. NEW subagent spawned to continue from checkpoint
6. Continuation subagent receives decision context

**Why new subagent?**
- Original subagent context may be stale
- Fresh context ensures quality for remaining tasks
- Decision context explicitly passed

## Subagent Prompts

### Planning Subagent

```
Execute the /gsd:plan-phase workflow for phase {phase-number}.

You have fresh context. Your job is to:
1. Read .planning/STATE.md, ROADMAP.md, PROJECT.md
2. Follow .claude/get-shit-done/workflows/plan-phase.md
3. Create all PLAN.md files for this phase
4. Commit plans with: docs({phase}): create phase plans

When complete, report back with:
- plans_created: number of plans
- plan_files: list of {path, objective, has_decision_checkpoint, has_verify_checkpoint}
- any planning decisions made

Do NOT execute the plans - only create them.
```

### Execution Subagent

```
Execute the plan at {plan_path}

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
---END_REPORT---
```

### Continuation Subagent (After Decision)

```
Continue executing plan at {plan_path}

User decided: {decision_choice} for the decision "{decision_question}"

Resume from the task AFTER the decision checkpoint.
The decision checkpoint has been resolved - proceed with that choice.

Complete remaining tasks, create SUMMARY.md, update STATE.md.

Report back with same format:
---REPORT---
status: complete | decision_needed | failed
commits: [list of {hash, message}]
verify_items: [list of {plan, what_built, how_to_verify}]
duration: execution time in seconds
---END_REPORT---
```

## State Tracking

Main context tracks minimal state for orchestration:

```
Phase: {phase_number}
Phase Dir: {phase_directory_name}
Plans: [{plan_id}, ...]
Completed: [{plan_id}, ...]
Current: {plan_id}
Verify Batch: [{plan, what_built, how_to_verify}, ...]
Commit Log: [{hash, message}, ...]
Start Time: {timestamp}
```

This enables:
- Progress display during execution
- Resume after decision checkpoints
- Final summary generation

## Error Recovery

### Subagent Timeout

If subagent doesn't respond within timeout:
1. Kill subagent (if possible)
2. Report partial progress (plans completed so far)
3. Offer: Retry / Skip / Abort

### Task Failure

If subagent reports `status='failed'`:
1. Display error details
2. Offer: Retry / Skip / Abort
3. If Skip: Mark plan incomplete, continue to next
4. Progress preserved either way

### Git Conflict

If subagent encounters git conflict:
1. Stop execution
2. Report conflict details
3. Instruct user to resolve manually
4. After resolution, user can re-run `/gsd:auto-execute {phase}`
5. Already-completed plans (with SUMMARY) will be skipped

### Decision Checkpoint in Continuation

If continuation subagent hits ANOTHER decision checkpoint:
1. Same flow: return `status='decision_needed'`
2. Present new decision to user
3. Spawn another continuation subagent
4. (Rare - plans should have max 1-2 checkpoints)

## Output Formats

### Progress Display (During Execution)

```
════════════════════════════════════════
GSD Auto-Execute: Phase 14
════════════════════════════════════════

Plans: 5 (2 complete, 3 to execute)

Checkpoint analysis:
  14-03: autonomous
  14-04: 1 verify checkpoint (will batch)
  14-05: autonomous

Starting execution...

[14-03] ████████████ Complete (4m 12s)
        → feat(14-03): implement reward normalization
        → docs(14-03): complete reward normalization plan

[14-04] ████████████ Complete (6m 45s)
        → feat(14-04): add fitness evaluation
        → test(14-04): add evaluation tests
        → docs(14-04): complete fitness evaluation plan

[14-05] ████░░░░░░░░ In progress...
```

### Decision Checkpoint Display

```
════════════════════════════════════════
CHECKPOINT: Decision Required
════════════════════════════════════════

Plan: 14-05
Task 2 of 4: Choose tournament bracket strategy

Context:
Swiss tournament needs a bracket system for final rounds.
This affects how winners are determined and seeding.

Options:
1. single-elimination
   Pros: Simple, fast
   Cons: One loss eliminates

2. double-elimination
   Pros: Second chances
   Cons: More complex, longer

3. round-robin-finals
   Pros: Most fair
   Cons: Many games needed

════════════════════════════════════════
```

### Verification Batch Display

```
════════════════════════════════════════
VERIFICATION CHECKLIST
════════════════════════════════════════

Phase 14 complete. Please verify:

[ ] [14-03] Reward normalization
    → Run: cargo test rewards::normalization
    → Check: All rewards in [-1.0, 1.0] range

[ ] [14-04] Fitness evaluation pipeline
    → Run: cargo test evaluation
    → Check: Top agents have positive fitness scores

[ ] [14-05] Tournament integration
    → Run: cargo test --test tournament_integration
    → Check: Full tournament completes without panic

All items verified?
════════════════════════════════════════
```

### Completion Report

```
════════════════════════════════════════
PHASE 14 COMPLETE
════════════════════════════════════════

Duration: 18m 32s total
Plans executed: 3/3

Commits (9 total):
  abc1234 feat(14-03): implement reward normalization
  def5678 docs(14-03): complete reward normalization plan
  ghi9012 feat(14-04): add fitness evaluation
  jkl3456 test(14-04): add evaluation tests
  mno7890 docs(14-04): complete fitness evaluation plan
  ... (4 more)

Verifications: All passed

---

Next steps:
- /gsd:auto-execute 15 - Continue to next phase
- /gsd:progress - Review project status
- /gsd:verify-work 14 - Detailed acceptance testing

════════════════════════════════════════
```

## Edge Cases

### All Plans Already Complete

If all plans in phase have SUMMARY.md:
```
Phase 14 already complete (5/5 plans executed).

Run /gsd:auto-execute 15 for next phase.
```

### No Plans and Planning Fails

If planning subagent fails:
1. Report planning error
2. Suggest manual planning: `/gsd:plan-phase {phase}`
3. After manual planning, retry: `/gsd:auto-execute {phase}`

### Single Plan Phase

Works the same - just one execution subagent.

### Phase with Only Decision Checkpoints

Multiple decision checkpoints across plans:
1. Execute until first decision
2. Get user decision
3. Continue until next decision
4. Repeat
5. Still batch verify checkpoints at end

## Integration with Other Commands

- **After auto-execute:** `/gsd:progress` shows updated state
- **If issues found:** `/gsd:plan-fix {phase}` creates fix plans
- **For detailed testing:** `/gsd:verify-work {phase}` provides UAT guidance
- **To continue:** `/gsd:auto-execute {next-phase}` runs next phase
