---
name: fp:verify
description: Full verification that a patch works correctly
argument-hint: "<patch-name>"
allowed-tools:
  - Bash
  - Read
  - Write
  - Skill
---

<objective>
Perform full verification that a patch applies cleanly, builds successfully, and fixes the intended fingerprint difference.
</objective>

<context>
Patch to verify: $ARGUMENTS

This is a comprehensive verification that includes:
1. Clean source preparation
2. Full browser build
3. Fingerprint comparison
</context>

<process>
## Phase 1: Clean Source Preparation

1. **Reset source tree**:
   ```bash
   make revert && make copy-additions && make dir
   ```

2. **Verify patch applies**:
   - The patch should be included in the standard patch set
   - Or apply it manually for testing

3. **Create checkpoint**:
   ```bash
   make checkpoint
   ```

## Phase 2: Build

1. **Run full build**:
   ```bash
   python3 multibuild.py --target macos --arch arm64
   ```

2. **Extract to dist/**:
   ```bash
   cd dist && rm -rf Camoufox.app && unzip camoufox-*.mac.arm64.zip
   ```

3. **Verify executable**:
   - Check file exists
   - Check permissions

## Phase 3: Fingerprint Verification

1. **Run comparison**:
   ```bash
   python3 scripts/fp-compare.py --use-webkit
   ```

2. **Check results**:
   - Load `.planning/fp/comparison.json`
   - Verify the target parameter now matches
   - Check for any regressions

## Phase 4: Report

1. **Document results**:
   - Patch applies: Yes/No
   - Build succeeds: Yes/No
   - Target param fixed: Yes/No
   - Regressions: List any
</process>

<commands>
```bash
# Phase 1: Clean source
cd /Users/michaelaleksandrov/projects/camoufox && make revert && make copy-additions && make dir && make checkpoint

# Phase 2: Build
cd /Users/michaelaleksandrov/projects/camoufox && python3 multibuild.py --target macos --arch arm64
cd /Users/michaelaleksandrov/projects/camoufox/dist && rm -rf Camoufox.app && unzip camoufox-*.mac.arm64.zip

# Phase 3: Compare
cd /Users/michaelaleksandrov/projects/camoufox && python3 scripts/fp-compare.py --use-webkit
```
</commands>

<success_criteria>
- Patch applies without conflicts
- Build completes without errors
- Target fingerprint parameter now matches real Safari
- No regressions in other parameters
</success_criteria>

<output>
Verification Report:
1. Patch application status
2. Build status
3. Fingerprint comparison results
4. Overall verdict (PASS/FAIL)
5. Any issues to address
</output>
