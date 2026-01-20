---
name: fp:fix
description: Implement fix for a fingerprint parameter based on analysis
argument-hint: "<param-name>"
allowed-tools:
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Bash
---

<objective>
Implement the fix for a fingerprint parameter based on the analysis plan. Modifies Firefox source files but does NOT create a patch yet.
</objective>

<context>
Parameter to fix: $ARGUMENTS

Load fix plan:
@.planning/fp/fixes/$ARGUMENTS.md
</context>

<process>
1. **Load fix plan**:
   - Read the fix plan from `.planning/fp/fixes/<param>.md`
   - Verify all required information is present
   - If no plan exists, suggest running `/fp:analyze` first

2. **Backup current state**:
   - Ensure we're at a checkpoint
   - Note current git status

3. **Implement changes**:
   - Follow the fix plan step by step
   - Modify Firefox source files as specified
   - Update MaskConfig if needed
   - Add any new config keys to properties.json

4. **Verify syntax**:
   - Check C++ files compile (basic syntax check)
   - Verify JavaScript is valid
   - Check IDL files if modified

5. **Update fix plan status**:
   - Mark implementation steps as done
   - Note any deviations from plan
</process>

<common_patterns>
## Navigator Property Spoofing
Location: `dom/base/Navigator.cpp`
Pattern: Check MaskConfig and return spoofed value

```cpp
void Navigator::GetSomeProperty(nsAString& aResult) {
  // Check for spoof
  nsAutoCString spoofed;
  if (MaskConfig::GetString("navigator.someProperty", spoofed)) {
    CopyUTF8toUTF16(spoofed, aResult);
    return;
  }
  // Original implementation
  ...
}
```

## Window Property Hiding
Location: `dom/base/nsGlobalWindowInner.cpp`
Pattern: Return undefined when hiding

```cpp
JSObject* nsGlobalWindowInner::GetSomeAPI() {
  if (MaskConfig::GetBool("window.someAPI:hide")) {
    return nullptr;
  }
  // Original implementation
  ...
}
```

## Adding to MaskConfig
Location: `additions/camoucfg/MaskConfig.cpp`
Pattern: Add getter for new config type
</common_patterns>

<success_criteria>
- All planned changes implemented
- No syntax errors in modified files
- Changes are consistent with existing patterns
- Fix plan updated with implementation status
</success_criteria>

<output>
1. List of files modified
2. Summary of changes made
3. Any issues encountered
4. Ready for testing/patching status
</output>
