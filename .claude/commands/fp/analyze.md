---
name: fp:analyze
description: Research and plan fix for a specific fingerprint parameter difference
argument-hint: "<param-name>"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Task
  - Write
---

<objective>
Research how to fix a specific fingerprint parameter difference between real Safari and spoofed Camoufox. Creates a detailed fix plan.
</objective>

<context>
Parameter to analyze: $ARGUMENTS

Load current comparison data:
@.planning/fp/comparison.json
</context>

<process>
1. **Understand the parameter**
   - Find the parameter in comparison.json
   - Note the real Safari value vs spoofed Camoufox value
   - Understand what this parameter represents

2. **Search Firefox source for implementation**
   - Search in `camoufox-*/dom/` for DOM API implementations
   - Search in `camoufox-*/js/` for JavaScript implementations
   - Search in `camoufox-*/toolkit/` for toolkit components
   - Common locations:
     - Navigator properties: `dom/base/Navigator.cpp`
     - Screen properties: `dom/base/Screen.cpp`
     - Window properties: `dom/base/nsGlobalWindowInner.cpp`
     - WebGL: `dom/canvas/`

3. **Check existing patches**
   - Search `patches/*.patch` for similar spoofing implementations
   - Look for MaskConfig usage patterns
   - Check `additions/camoucfg/` for config handling

4. **Research Safari behavior**
   - Search for Safari-specific implementation details
   - Check WebKit source if needed for reference

5. **Create fix plan**
   - Document the approach
   - List files to modify
   - Note any MaskConfig additions needed
   - Consider side effects
</process>

<fix_plan_template>
Create fix plan at: `.planning/fp/fixes/<param-name>.md`

```markdown
# Fix Plan: <param-name>

## Current State
- **Real Safari value**: <value>
- **Spoofed Camoufox value**: <value>
- **Detection risk**: High/Medium/Low

## Root Cause
<Why the values differ>

## Implementation

### Files to Modify
1. `<file-path>` - <what to change>

### MaskConfig Changes
- Add `<config-key>` for <purpose>

### Code Changes
```cpp
// Location: <file>:<line>
// Change: <description>
```

## Testing
- [ ] Value matches Safari
- [ ] No regressions in other properties
- [ ] Patch applies cleanly

## References
- Similar patch: `patches/<name>.patch`
- Firefox source: `<file>`
```
</fix_plan_template>

<success_criteria>
- Parameter is found in Firefox source
- Implementation approach is clear
- Fix plan is documented in .planning/fp/fixes/
- No blocking issues identified
</success_criteria>

<output>
1. Summary of findings
2. Proposed fix approach
3. Files that need modification
4. Any risks or concerns
5. Path to fix plan document
</output>
