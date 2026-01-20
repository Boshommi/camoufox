---
name: fp:patch
description: Create a git patch from current source changes
argument-hint: "<patch-name>"
allowed-tools:
  - Bash
  - Read
  - Write
---

<objective>
Create a git patch file from the current changes in the Firefox source directory.
</objective>

<context>
Patch name: $ARGUMENTS

The patch will be saved to: `patches/$ARGUMENTS.patch`
</context>

<process>
1. **Check current state**:
   - Verify we're in the source directory
   - Check git status for changes
   - Ensure changes are what we expect

2. **Generate diff**:
   ```bash
   cd camoufox-144.0.2-bluetaka.27 && git diff HEAD > ../patches/<name>.patch
   ```

3. **Verify patch**:
   - Check patch file is not empty
   - Verify it contains expected changes
   - Test that it applies cleanly (dry-run)

4. **Update patch index**:
   - If needed, update scripts/patch.py to include new patch
   - Determine correct patch ordering
</process>

<naming_convention>
Patch names should follow existing patterns:
- `XXX-feature-name.patch` where XXX is a number
- Use next available number from `scripts/next_patch.py`
- Descriptive name in kebab-case

Examples:
- `057-navigator-vendor-spoof.patch`
- `058-installtrigger-hide.patch`
</naming_convention>

<commands>
```bash
# Check current changes
cd /Users/michaelaleksandrov/projects/camoufox/camoufox-144.0.2-bluetaka.27 && git status && git diff --stat

# Generate patch
cd /Users/michaelaleksandrov/projects/camoufox/camoufox-144.0.2-bluetaka.27 && git diff HEAD > ../patches/$ARGUMENTS.patch

# Verify patch applies
cd /Users/michaelaleksandrov/projects/camoufox && make revert && patch -p1 --dry-run -d camoufox-144.0.2-bluetaka.27 < patches/$ARGUMENTS.patch
```
</commands>

<success_criteria>
- Patch file created in patches/
- Patch is not empty
- Patch applies cleanly in dry-run
- Patch name follows convention
</success_criteria>

<output>
1. Patch file location
2. Files included in patch
3. Patch size (lines added/removed)
4. Dry-run apply result
</output>
