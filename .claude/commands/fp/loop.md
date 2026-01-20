---
name: fp:loop
description: Master orchestrator - iteratively fix fingerprint differences
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - Edit
  - AskUserQuestion
  - Skill
---

<objective>
Orchestrate the complete fingerprint fixing loop. Iteratively identifies differences, analyzes them, implements fixes, and verifies until all critical differences are resolved.
</objective>

<context>
Load current state:
@.planning/fp/comparison.json

Priority order for fixes:
1. **Critical**: Browser detection APIs (InstallTrigger, webkit, chrome, etc.)
2. **High**: Navigator properties (vendor, platform, userAgent components)
3. **Medium**: WebGL properties (renderer, vendor, extensions)
4. **Low**: Window/Screen dimensions (often environment-dependent)
</context>

<process>
## Phase 1: Initial Assessment

1. **Check if comparison exists**:
   - If no comparison.json, run `/fp:compare --use-webkit` first
   - Load and analyze current differences

2. **Prioritize differences**:
   - Sort by detection risk
   - Identify quick wins vs complex fixes
   - Note any that are environment-dependent (skip these)

## Phase 2: Fix Loop

For each difference (highest priority first):

1. **Analyze** (`/fp:analyze <param>`):
   - Research the parameter
   - Create fix plan
   - If blocked, note and move to next

2. **Fix** (`/fp:fix <param>`):
   - Implement the fix
   - Follow the fix plan

3. **Quick Test** (optional):
   - Run quick build check if possible
   - Skip full build for batching

4. **Batch or Patch**:
   - For related fixes, batch into single patch
   - For standalone fixes, create individual patch

## Phase 3: Verification

After batch of fixes:

1. **Create patch** (`/fp:patch <name>`):
   - Capture all changes
   - Use descriptive name

2. **Verify** (`/fp:verify <name>`):
   - Full clean build
   - Run comparison
   - Confirm fixes worked

3. **Iterate**:
   - If new differences found, continue loop
   - If regressions, investigate and fix

## Phase 4: Completion

When no critical differences remain:
- Summarize all patches created
- Document any remaining low-priority differences
- Report final state
</process>

<stopping_conditions>
Stop the loop when:
- All critical differences are fixed
- Only environment-dependent differences remain
- User requests stop
- Blocking issue requires human intervention
</stopping_conditions>

<state_tracking>
Track progress in `.planning/fp/loop-state.json`:
```json
{
  "started": "timestamp",
  "current_phase": "analyze|fix|verify",
  "current_param": "param-name",
  "fixed": ["param1", "param2"],
  "skipped": ["param3"],
  "patches_created": ["patch1.patch"],
  "remaining": ["param4", "param5"]
}
```
</state_tracking>

<user_checkpoints>
Ask user before:
- Starting a full build (time consuming)
- Creating a patch (confirm changes look good)
- Moving to next priority tier
</user_checkpoints>

<output>
Provide regular updates:
- Current phase and parameter
- Progress (X of Y differences addressed)
- Any issues encountered
- Next steps
</output>
