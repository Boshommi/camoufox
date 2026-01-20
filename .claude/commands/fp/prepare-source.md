---
name: fp:prepare-source
description: Reset and prepare Firefox source for new patch or testing
allowed-tools:
  - Bash
  - Read
---

<objective>
Reset the Camoufox source tree to a clean state with all patches applied, ready for new modifications or testing.
</objective>

<process>
1. **Revert to unpatched state**:
   ```bash
   make revert
   ```
   This resets git to the 'unpatched' tag (vanilla Firefox + additions)

2. **Copy additions and settings**:
   ```bash
   make copy-additions
   ```
   Copies additions/ and settings/ directories to the source tree

3. **Apply all patches**:
   ```bash
   make dir
   ```
   Runs `scripts/patch.py` to apply all patches in order

4. **Create checkpoint**:
   ```bash
   make checkpoint
   ```
   Creates a git commit to mark the current state for later diffing
</process>

<commands>
Run the following command:
```bash
cd /Users/michaelaleksandrov/projects/camoufox && make revert && make copy-additions && make dir && make checkpoint
```
</commands>

<success_criteria>
- Source tree is clean
- All patches applied without conflicts
- Checkpoint commit created
- `_READY` file exists in source directory
</success_criteria>

<output>
Report:
- Number of patches applied
- Any warnings or skipped patches
- Final git status
</output>
