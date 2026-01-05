# Camoufox Patch Creation Guide

This guide explains how to create new patches for the Camoufox project, specifically for adding new fingerprint spoofing features.

## Overview

Camoufox uses a patch-based system where modifications to Firefox source code are stored as `.patch` files in the `patches/` directory. These patches are applied during the build process to inject custom spoofing capabilities.

## Prerequisites

-   Camoufox source directory set up (e.g., `camoufox-VERSION-RELEASE/`)
-   Git initialized in the source directory for tracking changes
-   Understanding of C++ and Firefox's codebase structure

## Step-by-Step Process

### 1. Set Up Git Baseline

Before making any changes, ensure you have a clean git baseline:

```bash
cd camoufox-VERSION-RELEASE
git init
git add -A
git commit -m "Baseline before [feature-name] patch"
```

### 2. Make Your Source Code Changes

Edit the relevant C++ files in the Firefox source tree. Common locations:

-   **`dom/base/`** - DOM API implementations (Navigator, Window, Screen, etc.)
-   **`dom/workers/`** - Web Worker implementations
-   **`dom/battery/`**, **`dom/geolocation/`** - Specific API implementations
-   **`intl/`** - Internationalization/locale code
-   \*\*ETC

### 3. Update Configuration Files

After modifying source code, update these configuration files in the main Camoufox directory:

#### A. `settings/properties.json`

Add your new property to the list:

```json
{ "property": "navigator.plugins", "type": "array" }
```

**Available types:**

-   `str` - String values
-   `uint` - Unsigned integers
-   `int` - Signed integers
-   `double` - Floating point numbers
-   `bool` - Boolean values
-   `array` - Arrays/lists
-   `dict` - Objects/dictionaries

#### B. `settings/camoucfg.jvv`

Add validation schema for your property:

```javascript
"navigator.plugins": "array[@PLUGIN_TYPE]",

"@PLUGIN_TYPE": {
    "*name": "str",              // * means required
    "description": "str",        // optional
    "filename": "str",           // optional
    "mimeTypes": "array[@MIMETYPE_TYPE | str]"
},
```

**Validation patterns:**

-   `"int[>0]"` - Integer greater than 0
-   `"int[>=0]"` - Integer greater than or equal to 0
-   `"double[>0]"` - Positive double
-   `"str[/^regex$/]"` - String matching regex
-   `"array[type]"` - Array of specific type
-   `"type1 | type2"` - Union types

#### C. `additions/camoucfg/MaskConfig.hpp` (if needed)

For complex data structures, add helper functions similar to existing ones:

```cpp
// Helper struct
struct PluginData {
  std::string name;
  std::string description;
  std::vector<MimeTypeData> mimeTypes;
};

// Helper function
inline std::optional<std::vector<PluginData>> MPlugins() {
  auto data = GetJson();
  if (!data.contains("navigator.plugins") || !data["navigator.plugins"].is_array()) {
    return std::nullopt;
  }

  std::vector<PluginData> plugins;
  // Parse JSON and populate plugins vector
  return plugins;
}
```

### 4. Add MaskConfig Support to C++ Files

Import MaskConfig in your C++ files:

```cpp
#include "MaskConfig.hpp"
```

Use it to override values:

```cpp
void Navigator::GetUserAgent(nsAString& aUserAgent) {
  if (auto value = MaskConfig::GetString("navigator.userAgent")) {
    aUserAgent.Assign(NS_ConvertUTF8toUTF16(value.value()));
    return;
  }
  // Original implementation...
}
```

**Common MaskConfig Methods:**

-   `GetString(key)` → `std::optional<std::string>`
-   `GetBool(key)` → `std::optional<bool>`
-   `GetInt32(key)` → `std::optional<int32_t>`
-   `GetUint32(key)` → `std::optional<uint32_t>`
-   `GetUint64(key)` → `std::optional<uint64_t>`
-   `GetDouble(key)` → `std::optional<double>`
-   `GetStringList(key)` → `std::vector<std::string>`
-   `GetRect(left, top, width, height)` → `std::optional<std::array<uint32_t, 4>>`
-   `GetJson()` → `const nlohmann::json&` (for complex structures)

### 5. Update `moz.build` Files (Check First!)

**IMPORTANT:** Before adding `LOCAL_INCLUDES += ["/camoucfg"]` to any `moz.build` file, check if it's already added in `fingerprint-injection.patch`!

The following `moz.build` files already have this line in `fingerprint-injection.patch`:

-   `browser/app/moz.build`
-   `dom/base/moz.build`
-   `dom/battery/moz.build`
-   `dom/workers/moz.build`

Only add it to **new** `moz.build` files that aren't already covered:

```python
# DOM Mask
LOCAL_INCLUDES += ["/camoucfg"]
```

### 6. Generate the Patch File

Once all changes are made and tested:

```bash
cd camoufox-VERSION-RELEASE
git add -A
git diff HEAD > ../patches/your-feature-spoofing.patch
echo "Patch created successfully"
```

Or if you've already committed:

```bash
git diff baseline_tag > ../patches/your-feature-spoofing.patch
```

### 7. Test Your Patch

Apply and test your patch:

```bash
cd /path/to/camoufox
make revert  # Reset to clean state
make patch patches/your-feature-spoofing.patch
make build
```

## Common Patterns & Best Practices

### Pattern 1: Simple Property Override

For simple properties like strings, numbers, or booleans:

```cpp
void Navigator::GetPlatform(nsAString& aPlatform) {
  if (auto value = MaskConfig::GetString("navigator.platform")) {
    aPlatform.Assign(NS_ConvertUTF8toUTF16(value.value()));
    return;
  }
  // Original implementation
}
```

### Pattern 2: Array/List Properties

For arrays like `navigator.languages`:

```cpp
void Navigator::GetLanguages(nsTArray<nsString>& aLanguages) {
  if (std::vector<std::string> maskValues =
          MaskConfig::GetStringList("navigator.languages");
      !maskValues.empty()) {
    aLanguages.Clear();
    for (const auto& lang : maskValues) {
      aLanguages.AppendElement(NS_ConvertUTF8toUTF16(lang));
    }
    return;
  }
  // Original implementation
}
```

### Pattern 3: Complex Object Structures

For complex structures like plugins:

1. Define helper structs in `MaskConfig.hpp`
2. Create a parsing function (e.g., `MPlugins()`)
3. Use the helper in your implementation:

```cpp
if (auto pluginsData = MaskConfig::MPlugins()) {
  for (const auto& pluginData : *pluginsData) {
    // Process each plugin
  }
}
```

### Pattern 4: Conditional Override

Override only if configured, otherwise use default:

```cpp
uint64_t Navigator::HardwareConcurrency() {
  if (auto value = MaskConfig::GetUint64("navigator.hardwareConcurrency")) {
    return value.value();
  }
  // Default behavior
  return GetSystemHardwareConcurrency();
}
```

## Implementing New APIs (Not in Firefox)

Sometimes you need to implement an API that doesn't exist in Firefox at all (e.g., Chromium-only APIs). This requires creating new WebIDL interfaces and C++ implementations from scratch.

### Example: UA Client Hints API (`navigator.userAgentData`)

The UA Client Hints API exists in Chromium but not Firefox. Here's how to implement it:

### Step 1: Create WebIDL Interface

Create `dom/webidl/NavigatorUAData.webidl`:

```webidl
/* -*- Mode: IDL; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * https://wicg.github.io/ua-client-hints/
 */

dictionary NavigatorUABrandVersion {
  DOMString brand = "";
  DOMString version = "";
};

dictionary UADataValues {
  sequence<NavigatorUABrandVersion> brands;
  boolean mobile = false;
  DOMString platform = "";
  DOMString architecture = "";
  // ... other fields
};

[Exposed=(Window,Worker)]
interface NavigatorUAData {
  [Cached, Pure]
  readonly attribute sequence<NavigatorUABrandVersion> brands;
  readonly attribute boolean mobile;
  readonly attribute DOMString platform;

  [NewObject]
  Promise<UADataValues> getHighEntropyValues(sequence<DOMString> hints);

  [Default] object toJSON();
};
```

**⚠️ WebIDL Gotchas:**

- Use `sequence<T>` with `[Cached, Pure]` instead of `FrozenArray<T>` for dictionary types
- Firefox's WebIDL parser doesn't support `FrozenArray<dictionary>`
- Dictionary members with default values (e.g., `boolean mobile = false`) are NOT `Optional<>` types
- Dictionary members WITHOUT defaults (e.g., `sequence<T> brands`) ARE `Optional<>` and need `.Construct()`

### Step 2: Create C++ Header

Create `dom/base/NavigatorUAData.h`:

```cpp
#ifndef mozilla_dom_NavigatorUAData_h
#define mozilla_dom_NavigatorUAData_h

#include "mozilla/dom/NavigatorUADataBinding.h"
#include "nsCycleCollectionParticipant.h"
#include "nsWrapperCache.h"

namespace mozilla::dom {

class NavigatorUAData final : public nsISupports, public nsWrapperCache {
 public:
  NS_DECL_CYCLE_COLLECTING_ISUPPORTS
  NS_DECL_CYCLE_COLLECTION_WRAPPERCACHE_CLASS(NavigatorUAData)

  explicit NavigatorUAData(nsIGlobalObject* aGlobal);

  nsIGlobalObject* GetParentObject() const { return mGlobal; }
  JSObject* WrapObject(JSContext* aCx, JS::Handle<JSObject*> aGivenProto) override;

  // WebIDL methods
  void GetBrands(nsTArray<NavigatorUABrandVersion>& aBrands);
  bool Mobile() const;
  void GetPlatform(nsAString& aPlatform) const;
  already_AddRefed<Promise> GetHighEntropyValues(
      const Sequence<nsString>& aHints, ErrorResult& aRv);
  void ToJSON(JSContext* aCx, JS::MutableHandle<JSObject*> aRetval, ErrorResult& aRv);

 private:
  ~NavigatorUAData();
  nsCOMPtr<nsIGlobalObject> mGlobal;
  nsTArray<NavigatorUABrandVersion> mBrands;
};

}  // namespace mozilla::dom

#endif
```

### Step 3: Create C++ Implementation

Create `dom/base/NavigatorUAData.cpp`:

```cpp
#include "NavigatorUAData.h"
#include "MaskConfig.hpp"
#include "mozilla/dom/Promise.h"

namespace mozilla::dom {

NS_IMPL_CYCLE_COLLECTION_WRAPPERCACHE(NavigatorUAData, mGlobal)
NS_IMPL_CYCLE_COLLECTING_ADDREF(NavigatorUAData)
NS_IMPL_CYCLE_COLLECTING_RELEASE(NavigatorUAData)

NS_INTERFACE_MAP_BEGIN_CYCLE_COLLECTION(NavigatorUAData)
  NS_WRAPPERCACHE_INTERFACE_MAP_ENTRY
  NS_INTERFACE_MAP_ENTRY(nsISupports)
NS_INTERFACE_MAP_END

NavigatorUAData::NavigatorUAData(nsIGlobalObject* aGlobal) : mGlobal(aGlobal) {}
NavigatorUAData::~NavigatorUAData() = default;

JSObject* NavigatorUAData::WrapObject(JSContext* aCx,
                                      JS::Handle<JSObject*> aGivenProto) {
  return NavigatorUAData_Binding::Wrap(aCx, this, aGivenProto);
}

bool NavigatorUAData::Mobile() const {
  if (auto value = MaskConfig::GetBool("navigator.userAgentData:mobile")) {
    return *value;
  }
  return false;
}

// ... implement other methods
}
```

### Step 4: Register in moz.build Files

**A. Register WebIDL (`dom/webidl/moz.build`):**

```python
WEBIDL_FILES += [
    # ... existing files ...
    "NavigatorUAData.webidl",  # Add alphabetically
]
```

**B. Register C++ files (`dom/base/moz.build`):**

```python
EXPORTS.mozilla.dom += [
    # ... existing exports ...
    "NavigatorUAData.h",
]

UNIFIED_SOURCES += [
    # ... existing sources ...
    "NavigatorUAData.cpp",
]
```

### Step 5: Wire Up to Navigator Interface

**A. Add to Navigator.webidl:**

```webidl
// https://wicg.github.io/ua-client-hints/
partial interface Navigator {
  [SameObject]
  readonly attribute NavigatorUAData userAgentData;
};
```

**B. Add to WorkerNavigator.webidl:**

```webidl
// https://wicg.github.io/ua-client-hints/
[Exposed=Worker]
partial interface WorkerNavigator {
  [SameObject]
  readonly attribute NavigatorUAData userAgentData;
};
```

**C. Update Navigator.h:**

```cpp
// Forward declaration
class NavigatorUAData;

class Navigator final : public nsISupports, public nsWrapperCache {
  // ...
  NavigatorUAData* UserAgentData();
  // ...
 private:
  RefPtr<NavigatorUAData> mUserAgentData;
};
```

**D. Update Navigator.cpp:**

```cpp
#include "NavigatorUAData.h"

// Add to cycle collection
NS_IMPL_CYCLE_COLLECTION_TRAVERSE(mUserAgentData)

NavigatorUAData* Navigator::UserAgentData() {
  // Conditional enable - return nullptr to hide the API
  if (auto enabled = MaskConfig::GetBool("navigator.userAgentData")) {
    if (!*enabled) {
      return nullptr;
    }
  }

  if (!mUserAgentData) {
    nsCOMPtr<nsIGlobalObject> global = do_QueryInterface(mWindow);
    if (global) {
      mUserAgentData = new NavigatorUAData(global);
    }
  }
  return mUserAgentData;
}
```

**E. Repeat for WorkerNavigator.h and WorkerNavigator.cpp**

### Step 6: Handle Dictionary Member Types

When working with WebIDL dictionaries in C++:

```cpp
// Dictionary members WITH defaults - direct assignment
result.mMobile = Mobile();
result.mPlatform.AssignLiteral(u"Windows");

// Dictionary members WITHOUT defaults - use .Construct()
result.mBrands.Construct(mBrands.Clone());
result.mFullVersionList.Construct(std::move(fullVersionList));
```

### New API Checklist

- [ ] Create WebIDL interface file (`dom/webidl/YourAPI.webidl`)
- [ ] Create C++ header (`dom/base/YourAPI.h`)
- [ ] Create C++ implementation (`dom/base/YourAPI.cpp`)
- [ ] Register WebIDL in `dom/webidl/moz.build`
- [ ] Register C++ files in `dom/base/moz.build` (EXPORTS and UNIFIED_SOURCES)
- [ ] Add partial interface to `Navigator.webidl`
- [ ] Add partial interface to `WorkerNavigator.webidl`
- [ ] Update `Navigator.h` (forward decl, method, member)
- [ ] Update `Navigator.cpp` (include, cycle collection, implementation)
- [ ] Update `WorkerNavigator.h` (forward decl, method, member)
- [ ] Update `WorkerNavigator.cpp` (include, cycle collection, implementation)
- [ ] Add config properties to `settings/properties.json`
- [ ] Add validation to `settings/camoucfg.jvv`
- [ ] Test in main thread and workers

## File Organization

### Required Files for a Complete Feature

1. **Source code changes** - Modified C++ files
2. **Patch file** - `patches/feature-name-spoofing.patch`
3. **Config files** - `settings/properties.json` and `settings/camoucfg.jvv`
4. **Test file** - `test.py` example (optional)
5. **Documentation** - Update README if needed

## Common Pitfalls & Solutions

### ❌ Problem: Compilation Error - `MaskConfig.hpp not found`

**Solution:** Add to `moz.build`:

```python
LOCAL_INCLUDES += ["/camoucfg"]
```

### ❌ Problem: Duplicate `LOCAL_INCLUDES` in Patch

**Solution:** Check if already in `fingerprint-injection.patch`. Don't duplicate!

### ❌ Problem: Type Mismatch Errors

**Solution:** Use proper string conversions:

-   C++ std::string → Firefox nsAString: `NS_ConvertUTF8toUTF16(value)`
-   Firefox nsAString → C++ std::string: `NS_ConvertUTF16toUTF8(value)`

### ❌ Problem: Patch Fails to Apply

**Solution:**

1. Check line numbers match the source
2. Ensure no conflicting patches
3. Regenerate patch from clean baseline

### ❌ Problem: Feature Works in Main Thread but not Workers

**Solution:** Also patch `dom/workers/WorkerNavigator.cpp` for worker support

### ❌ Problem: `LOCAL_INCLUDES` UnsortedError

**Solution:** Mozilla's build system requires `LOCAL_INCLUDES` to be **alphabetically sorted**. The sort order is:
1. Relative paths first (`../base`, `../generic`, etc.)
2. Then absolute paths alphabetically (`/camoucfg`, `/dom/base`, `/dom/html`, etc.)

```python
# ✅ Correct - alphabetically sorted
LOCAL_INCLUDES += [
    "../base",
    "../generic",
    "/camoucfg",      # /c comes before /d
    "/dom/base",
    "/dom/html",
]

# ❌ Wrong - will cause UnsortedError
LOCAL_INCLUDES += [
    "../base",
    "/dom/base",
    "/camoucfg",      # Out of order!
]
```

### ❌ Problem: `MaskConfig.hpp not found` during Servo Bindings Generation

**Cause:** You included `MaskConfig.hpp` in a **header file** (`.h`), not a `.cpp` file. Servo bindings are generated early in the build process, before `camoucfg` exports its headers to `dist/include`.

**Solution:** Never include `MaskConfig.hpp` in header files. Only include it in `.cpp` files.

If you need MaskConfig in a method defined inline in a header:
1. Change the inline implementation to just a **declaration** in the header
2. Move the **implementation** to the `.cpp` file
3. Add `#include "MaskConfig.hpp"` to the `.cpp` file

```cpp
// ❌ Wrong - nsPresContext.h (header file)
#include "MaskConfig.hpp"  // Will fail during Servo bindings!

mozilla::StyleForcedColors ForcedColors() const {
  if (auto value = MaskConfig::GetString("mediaQuery:forced-colors")) {
    // ...
  }
  return mForcedColors;
}

// ✅ Correct - nsPresContext.h (declaration only)
mozilla::StyleForcedColors ForcedColors() const;

// ✅ Correct - nsPresContext.cpp (implementation)
#include "MaskConfig.hpp"

StyleForcedColors nsPresContext::ForcedColors() const {
  if (auto value = MaskConfig::GetString("mediaQuery:forced-colors")) {
    if (*value == "active") return StyleForcedColors::Active;
    return StyleForcedColors::None;
  }
  return mForcedColors;
}
```

### ❌ Problem: `cannot use 'throw' with exceptions disabled` in json.hpp

**Cause:** Firefox builds with `-fno-exceptions`, but nlohmann/json uses `throw` by default.

**Solution:** Add `JSON_NOEXCEPTION` define at the top of `additions/camoucfg/json.hpp`:

```cpp
// Disable exceptions for Mozilla Firefox build (uses -fno-exceptions)
#ifndef JSON_NOEXCEPTION
#define JSON_NOEXCEPTION 1
#endif

#ifndef INCLUDE_NLOHMANN_JSON_HPP_
#define INCLUDE_NLOHMANN_JSON_HPP_
// ... rest of json.hpp
```

### ❌ Problem: Canvas/Image Data Stride vs Width

**Cause:** When working with `DataSourceSurface` pixel data, the stride (bytes per row) may be larger than `width * 4` due to memory alignment padding.

**Solution:** Always use `GetStride()` instead of assuming `width * 4`:

```cpp
RefPtr<gfx::DataSourceSurface> dataSurface = surface->GetDataSurface();
gfx::DataSourceSurface::ScopedMap map(dataSurface, gfx::DataSourceSurface::READ);

int32_t width = dataSurface->GetSize().width;
int32_t height = dataSurface->GetSize().height;
int32_t stride = map.GetStride();  // ✅ Use actual stride, not width * 4

const uint8_t* data = map.GetData();
for (int y = 0; y < height; y++) {
  const uint8_t* row = data + y * stride;  // ✅ Correct row offset
  for (int x = 0; x < width; x++) {
    // Access pixel at row[x * 4 + channel]
  }
}
```

## Patch Naming Convention

Follow this naming pattern:

-   `feature-name-spoofing.patch` - For spoofing features
-   `feature-name.patch` - For other modifications

Examples:

-   `plugin-spoofing.patch`
-   `geolocation-spoofing.patch`
-   `locale-spoofing.patch`
-   `network-info-spoofing.patch`

## Testing Your Implementation

### Basic Test in Python

```python
from camoufox import Camoufox

with Camoufox(
    executable_path="dist/Camoufox.app/Contents/MacOS/camoufox",
    config={
        "navigator.plugins": [
            {
                "name": "Test Plugin",
                "description": "Test Description",
                "filename": "test.dll",
            }
        ],
    },
) as browser:
    page = browser.new_page()
    plugins = page.evaluate("Array.from(navigator.plugins).map(p => ({name: p.name, description: p.description}))")
    print(plugins)
```

### Testing in All Contexts

Test your spoofing works in:

1. **Main thread** - Regular page scripts
2. **Web Workers** - `new Worker(...)`
3. **Service Workers** - Service worker scripts
4. **iframes** - Cross-origin and same-origin

## Reference: Existing Patches

Learn from these well-structured patches:

1. **`geolocation-spoofing.patch`** - Good example of coordinate spoofing
2. **`locale-spoofing.patch`** - Complex string/language handling
3. **`fingerprint-injection.patch`** - Multiple property overrides
4. **`network-info-spoofing.patch`** - Object property spoofing

## Example: Complete Plugin Spoofing Implementation

See commit `3e9234c5e97efe1031a610f0c83c1cbd174304ab` for the complete plugin spoofing implementation as a reference.

## Troubleshooting Build Issues

### Check Patch Applied Correctly

```bash
cd camoufox-VERSION-RELEASE
git diff
```

### View Applied Changes

```bash
git log --oneline
git show HEAD
```

### Reset and Try Again

```bash
make revert
# Make your changes again
git add -A
git diff HEAD > ../patches/your-patch.patch
```

## Getting Help

-   Check existing patches in `patches/` for examples
-   Review Firefox source documentation
-   Test incrementally - one change at a time
-   Use `make ff-dbg` for a minimal debug build

---

**Last Updated:** Following Firefox 144.0.2 implementation patterns
**Reference Commit:** 3e9234c5e97efe1031a610f0c83c1cbd174304ab
