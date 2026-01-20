---
name: fp:build
description: Build Camoufox for macOS ARM64 and unzip to dist/
allowed-tools:
  - Bash
  - Read
---

<objective>
Build Camoufox browser for macOS ARM64 architecture and extract it to the dist/ directory for testing.
</objective>

<process>
1. **Run multibuild**:
   ```bash
   python3 multibuild.py --target macos --arch arm64
   ```
   This builds the browser using the configured mozconfig

2. **Extract the build**:
   ```bash
   cd dist && rm -rf Camoufox.app && unzip camoufox-*.mac.arm64.zip
   ```
   Removes any existing app and extracts the fresh build

3. **Verify executable**:
   Check that `dist/Camoufox.app/Contents/MacOS/camoufox` exists
</process>

<commands>
Run the following commands:
```bash
cd /Users/michaelaleksandrov/projects/camoufox && python3 multibuild.py --target macos --arch arm64
```

Then extract:
```bash
cd /Users/michaelaleksandrov/projects/camoufox/dist && rm -rf Camoufox.app && unzip camoufox-*.mac.arm64.zip
```
</commands>

<success_criteria>
- Build completes without errors
- Zip file created in dist/
- Camoufox.app extracted successfully
- Executable is present and has correct permissions
</success_criteria>

<output>
Report:
- Build duration (if available)
- Output file location
- Any build warnings
</output>
