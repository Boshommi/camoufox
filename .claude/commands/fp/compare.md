---
name: fp:compare
description: Run fingerprint comparison between real Safari and spoofed Camoufox
argument-hint: "[--use-webkit] [--headful]"
allowed-tools:
  - Bash
  - Read
  - Write
---

<objective>
Run the fingerprint comparison script to identify differences between real Safari and spoofed Camoufox browsers.
</objective>

<context>
Arguments: $ARGUMENTS

Default behavior:
- Uses Appium + iOS Simulator for real Safari
- Uses Camoufox from dist/Camoufox.app
- Outputs to .planning/fp/comparison.json

Options:
- `--use-webkit`: Use Playwright WebKit instead of iOS Simulator (faster, less accurate)
- `--headful`: Show browser windows
- `--spoofed-only`: Only collect spoofed fingerprint
- `--real-only`: Only collect real fingerprint
</context>

<process>
1. **Check prerequisites**:
   - Verify fp-detector.js exists
   - Verify Camoufox.app exists (unless --real-only)
   - Check Appium server is running (unless --use-webkit)

2. **Run comparison**:
   ```bash
   python3 scripts/fp-compare.py $ARGUMENTS
   ```

3. **Analyze results**:
   - Load .planning/fp/comparison.json
   - Summarize key differences
   - Prioritize by detection risk
</process>

<commands>
```bash
cd /Users/michaelaleksandrov/projects/camoufox && python3 scripts/fp-compare.py $ARGUMENTS
```
</commands>

<analysis>
After running, read the comparison file and provide:

1. **Summary statistics**:
   - Total properties checked
   - Number of matches
   - Number of differences
   - Properties only in real/spoofed

2. **Critical differences** (browser detection):
   - InstallTrigger presence
   - webkit object presence
   - navigator.vendor
   - Any API that identifies Firefox

3. **High priority differences**:
   - Navigator properties
   - WebGL renderer/vendor

4. **Low priority** (environment-dependent):
   - Screen dimensions
   - Window dimensions
   - Media devices
</analysis>

<success_criteria>
- Both browsers launched successfully
- Fingerprint detection ran in both
- comparison.json created with results
- Summary provided to user
</success_criteria>

<output>
1. Command output (any errors)
2. Summary of differences
3. Recommended next steps (which params to fix first)
</output>
