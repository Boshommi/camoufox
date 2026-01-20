#!/usr/bin/env python3
"""
Fingerprint Comparison Script for Camoufox

Compares fingerprints between:
1. Real iOS Safari (via iOS Simulator + Appium)
2. Spoofed Camoufox (via Playwright Firefox driver)

Usage:
    python3 scripts/fp-compare.py [--real-only] [--spoofed-only] [--output path]
"""

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any, Dict

# Paths
SCRIPT_DIR = Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR.parent
DETECTOR_JS = SCRIPT_DIR / "fp-detector.js"
OUTPUT_DIR = PROJECT_ROOT / ".planning" / "fp"
COMPARISON_FILE = OUTPUT_DIR / "comparison.json"

# Default Camoufox executable path
DEFAULT_CAMOUFOX_EXEC = PROJECT_ROOT / "dist" / "Camoufox.app" / "Contents" / "MacOS" / "camoufox"

# Safari iOS config to spoof
SAFARI_CONFIG = {
    "navigator.userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
    "navigator.appCodeName": "Mozilla",
    "navigator.appName": "Netscape",
    "navigator.appVersion": "5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
    "navigator.language": "en-US",
    "navigator.platform": "iPhone",
    "navigator.product": "Gecko",
    "navigator.productSub": "20030107",
    "navigator.languages": ["en-US"],
    "navigator.vendor": "Apple Computer, Inc.",
    "navigator.vendorSub": "",
    "navigator.webdriver": False,
    "navigator.userAgentData": False,
    "window.InstallTrigger:hide": True,
    "window.webkit": True,
    "window.devicePixelRatio": 3,
}


def load_detector_js() -> str:
    """Load the fingerprint detector JavaScript."""
    if not DETECTOR_JS.exists():
        raise FileNotFoundError(f"Detector JS not found at {DETECTOR_JS}")
    return DETECTOR_JS.read_text()


def run_detector_in_browser(page, detector_js: str) -> Dict[str, Any]:
    """Inject detector JS and run it in the browser."""
    # Inject the detector
    page.evaluate(detector_js)

    # Run detection
    result = page.evaluate("window.__fpDetector.detectAll()")
    return result


def get_spoofed_fingerprint(
    exec_path: str = None,
    config: Dict[str, Any] = None,
    headless: bool = True
) -> Dict[str, Any]:
    """Get fingerprint from Camoufox (spoofed browser)."""
    from camoufox import Camoufox, DefaultAddons

    exec_path = exec_path or str(DEFAULT_CAMOUFOX_EXEC)
    config = config or SAFARI_CONFIG

    if not Path(exec_path).exists():
        raise FileNotFoundError(f"Camoufox executable not found at {exec_path}")

    detector_js = load_detector_js()

    with Camoufox(
        executable_path=exec_path,
        ff_version=144,
        exclude_addons=[DefaultAddons.UBO],
        os="ios",
        debug=False,
        config=config,
        headless=headless,
    ) as browser:
        page = browser.new_page()
        page.goto("about:blank")
        time.sleep(0.5)  # Let page settle

        result = run_detector_in_browser(page, detector_js)
        page.close()

    return result


def get_real_safari_fingerprint(
    device_name: str = "iPhone 15 Pro",
    ios_version: str = "18.0",
    timeout: int = 60
) -> Dict[str, Any]:
    """Get fingerprint from real iOS Safari via Appium."""
    try:
        from appium import webdriver
        from appium.options.ios import XCUITestOptions
    except ImportError:
        print("ERROR: Appium not installed. Install with: pip install Appium-Python-Client")
        print("Also install XCUITest driver: appium driver install xcuitest")
        sys.exit(1)

    # Check if Appium server is running
    import urllib.request
    try:
        urllib.request.urlopen("http://localhost:4723/status", timeout=5)
    except Exception:
        print("ERROR: Appium server not running. Start with: appium")
        print("If not installed: npm install -g appium && appium driver install xcuitest")
        sys.exit(1)

    detector_js = load_detector_js()

    options = XCUITestOptions()
    options.platform_name = "iOS"
    options.platform_version = ios_version
    options.device_name = device_name
    options.browser_name = "Safari"
    options.automation_name = "XCUITest"
    options.no_reset = True

    driver = None
    try:
        print(f"Connecting to iOS Simulator ({device_name}, iOS {ios_version})...")
        driver = webdriver.Remote("http://localhost:4723", options=options)
        driver.implicitly_wait(timeout)

        print("Opening about:blank...")
        driver.get("about:blank")
        time.sleep(1)  # Let page settle

        print("Injecting detector and running...")
        # Inject and run detector
        driver.execute_script(detector_js)
        result = driver.execute_script("return window.__fpDetector.detectAll();")

        return result

    finally:
        if driver:
            driver.quit()


def get_real_webkit_fingerprint(headless: bool = True) -> Dict[str, Any]:
    """
    Fallback: Get fingerprint from Playwright WebKit.
    Note: This is NOT real Safari, but useful for comparison.
    """
    from playwright.sync_api import sync_playwright

    detector_js = load_detector_js()

    with sync_playwright() as p:
        browser = p.webkit.launch(headless=headless)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
            viewport={"width": 440, "height": 956},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
        )
        page = context.new_page()
        page.goto("about:blank")
        time.sleep(0.5)

        result = run_detector_in_browser(page, detector_js)

        page.close()
        context.close()
        browser.close()

    return result


def compare_fingerprints(
    real: Dict[str, Any],
    spoofed: Dict[str, Any]
) -> Dict[str, Any]:
    """Compare two fingerprint results and identify differences."""
    real_config = real.get("config", {})
    spoofed_config = spoofed.get("config", {})

    # All keys from both
    all_keys = set(real_config.keys()) | set(spoofed_config.keys())

    differences = []
    matches = []
    only_real = []
    only_spoofed = []

    for key in sorted(all_keys):
        in_real = key in real_config
        in_spoofed = key in spoofed_config

        if in_real and in_spoofed:
            real_val = real_config[key]
            spoofed_val = spoofed_config[key]

            if real_val == spoofed_val:
                matches.append({
                    "key": key,
                    "value": real_val
                })
            else:
                differences.append({
                    "key": key,
                    "real": real_val,
                    "spoofed": spoofed_val,
                    "type": type(real_val).__name__
                })
        elif in_real:
            only_real.append({
                "key": key,
                "value": real_config[key]
            })
        else:
            only_spoofed.append({
                "key": key,
                "value": spoofed_config[key]
            })

    return {
        "summary": {
            "total_keys": len(all_keys),
            "matches": len(matches),
            "differences": len(differences),
            "only_in_real": len(only_real),
            "only_in_spoofed": len(only_spoofed),
        },
        "differences": differences,
        "only_in_real": only_real,
        "only_in_spoofed": only_spoofed,
        "matches": matches,
        "metadata": {
            "real_unavailable": real.get("unavailable", []),
            "spoofed_unavailable": spoofed.get("unavailable", []),
            "real_errors": real.get("errors", []),
            "spoofed_errors": spoofed.get("errors", []),
            "detector_version": real.get("detectorVersion", "unknown"),
        }
    }


def print_summary(comparison: Dict[str, Any]):
    """Print a human-readable summary of the comparison."""
    summary = comparison["summary"]
    differences = comparison["differences"]

    print("\n" + "=" * 60)
    print("FINGERPRINT COMPARISON SUMMARY")
    print("=" * 60)
    print(f"Total properties: {summary['total_keys']}")
    print(f"Matches:          {summary['matches']}")
    print(f"Differences:      {summary['differences']}")
    print(f"Only in real:     {summary['only_in_real']}")
    print(f"Only in spoofed:  {summary['only_in_spoofed']}")

    if differences:
        print("\n" + "-" * 60)
        print("DIFFERENCES (Real vs Spoofed):")
        print("-" * 60)
        for diff in differences:
            key = diff["key"]
            real_val = diff["real"]
            spoofed_val = diff["spoofed"]

            # Truncate long values
            real_str = str(real_val)
            spoofed_str = str(spoofed_val)
            if len(real_str) > 50:
                real_str = real_str[:47] + "..."
            if len(spoofed_str) > 50:
                spoofed_str = spoofed_str[:47] + "..."

            print(f"\n{key}:")
            print(f"  Real:    {real_str}")
            print(f"  Spoofed: {spoofed_str}")

    only_real = comparison["only_in_real"]
    if only_real:
        print("\n" + "-" * 60)
        print("ONLY IN REAL SAFARI (missing from spoofed):")
        print("-" * 60)
        for item in only_real:
            print(f"  {item['key']}")

    only_spoofed = comparison["only_in_spoofed"]
    if only_spoofed:
        print("\n" + "-" * 60)
        print("ONLY IN SPOOFED (extra in spoofed):")
        print("-" * 60)
        for item in only_spoofed:
            print(f"  {item['key']}")

    print("\n" + "=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Compare fingerprints between real Safari and spoofed Camoufox"
    )
    parser.add_argument(
        "--real-only",
        action="store_true",
        help="Only collect real Safari fingerprint"
    )
    parser.add_argument(
        "--spoofed-only",
        action="store_true",
        help="Only collect spoofed Camoufox fingerprint"
    )
    parser.add_argument(
        "--use-webkit",
        action="store_true",
        help="Use Playwright WebKit instead of real iOS Safari (faster but less accurate)"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=str(COMPARISON_FILE),
        help="Output file path for comparison JSON"
    )
    parser.add_argument(
        "--exec-path",
        type=str,
        default=str(DEFAULT_CAMOUFOX_EXEC),
        help="Path to Camoufox executable"
    )
    parser.add_argument(
        "--headful",
        action="store_true",
        help="Run browsers in headful mode (visible)"
    )
    parser.add_argument(
        "--device",
        type=str,
        default="iPhone 15 Pro",
        help="iOS device name for simulator"
    )
    parser.add_argument(
        "--ios-version",
        type=str,
        default="18.0",
        help="iOS version for simulator"
    )

    args = parser.parse_args()

    headless = not args.headful

    # Ensure output directory exists
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    real_result = None
    spoofed_result = None

    # Collect real fingerprint
    if not args.spoofed_only:
        print("\n[1/2] Collecting REAL Safari fingerprint...")
        try:
            if args.use_webkit:
                print("Using Playwright WebKit (not real Safari)")
                real_result = get_real_webkit_fingerprint(headless=headless)
            else:
                real_result = get_real_safari_fingerprint(
                    device_name=args.device,
                    ios_version=args.ios_version
                )
            print(f"  Collected {len(real_result.get('config', {}))} properties")
        except Exception as e:
            print(f"  ERROR: {e}")
            if not args.use_webkit:
                print("  TIP: Try --use-webkit for faster testing without iOS Simulator")
            real_result = {"config": {}, "unavailable": [], "errors": [str(e)]}

    # Collect spoofed fingerprint
    if not args.real_only:
        print("\n[2/2] Collecting SPOOFED Camoufox fingerprint...")
        try:
            spoofed_result = get_spoofed_fingerprint(
                exec_path=args.exec_path,
                headless=headless
            )
            print(f"  Collected {len(spoofed_result.get('config', {}))} properties")
        except Exception as e:
            print(f"  ERROR: {e}")
            spoofed_result = {"config": {}, "unavailable": [], "errors": [str(e)]}

    # Compare and output
    if real_result and spoofed_result:
        comparison = compare_fingerprints(real_result, spoofed_result)
        comparison["raw"] = {
            "real": real_result,
            "spoofed": spoofed_result
        }

        # Save to file
        with open(output_path, "w") as f:
            json.dump(comparison, f, indent=2, default=str)
        print(f"\nComparison saved to: {output_path}")

        # Print summary
        print_summary(comparison)

    elif real_result:
        # Save just real
        with open(output_path, "w") as f:
            json.dump({"real": real_result}, f, indent=2, default=str)
        print(f"\nReal fingerprint saved to: {output_path}")

    elif spoofed_result:
        # Save just spoofed
        with open(output_path, "w") as f:
            json.dump({"spoofed": spoofed_result}, f, indent=2, default=str)
        print(f"\nSpoofed fingerprint saved to: {output_path}")

    else:
        print("\nERROR: No fingerprints collected")
        sys.exit(1)


if __name__ == "__main__":
    main()
