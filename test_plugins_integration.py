#!/usr/bin/env python3
"""
Integration test for navigator.plugins spoofing.
This script tests the custom plugin configuration feature of Camoufox.
"""

import os
import sys
from pathlib import Path

# Add pythonlib to path if running from project root
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root / "pythonlib"))

try:
    from camoufox import Camoufox
except ImportError:
    print("Error: camoufox library not found")
    print("Please install it first:")
    print("  pip install -e ./pythonlib")
    sys.exit(1)


def test_default_plugins():
    """Test that default Firefox plugins are returned when no config is provided."""
    print("\n=== Test 1: Default Plugins ===")

    with Camoufox(headless=True, debug=False) as browser:
        page = browser.new_page()
        page.goto("about:blank")

        plugins = page.evaluate(
            """() => {
            return Array.from(navigator.plugins).map(plugin => ({
                name: plugin.name,
                description: plugin.description,
                filename: plugin.filename,
                length: plugin.length
            }));
        }"""
        )

        print(f"Found {len(plugins)} default plugins")
        for plugin in plugins:
            print(f"  - {plugin['name']}: {plugin['description']}")

        assert len(plugins) > 0, "Should have at least one default plugin"
        print("✓ Test passed")


def test_custom_plugins():
    """Test custom plugin configuration."""
    print("\n=== Test 2: Custom Plugins ===")

    custom_config = {
        "navigator.plugins": [
            {
                "name": "Widevine Content Decryption Module",
                "description": "Provides DRM video playback support.",
                "filename": "widevinecdm.dll",
                "mimeTypes": [
                    "application/x-ppapi-widevine-cdm",
                    {
                        "type": "application/x-google-chrome-pdf",
                        "description": "Portable Document Format",
                        "suffixes": "pdf",
                    },
                ],
            },
            {
                "name": "Chrome PDF Plugin",
                "description": "Portable Document Format",
                "filename": "internal-pdf-viewer",
                "mimeTypes": [
                    {
                        "type": "application/pdf",
                        "description": "Portable Document Format",
                        "suffixes": "pdf",
                    }
                ],
            },
        ]
    }

    with Camoufox(headless=True, debug=False, config=custom_config) as browser:
        page = browser.new_page()
        page.goto("about:blank")

        # Get plugin data
        plugins = page.evaluate(
            """() => {
            return Array.from(navigator.plugins).map(plugin => ({
                name: plugin.name,
                description: plugin.description,
                filename: plugin.filename,
                length: plugin.length,
                mimeTypes: Array.from(plugin).map(mt => ({
                    type: mt.type,
                    description: mt.description,
                    suffixes: mt.suffixes
                }))
            }));
        }"""
        )

        print(f"Found {len(plugins)} custom plugins")

        # Verify we have the expected number of plugins
        assert len(plugins) == 2, f"Expected 2 plugins, got {len(plugins)}"

        # Verify first plugin (Widevine)
        widevine = plugins[0]
        assert (
            widevine["name"] == "Widevine Content Decryption Module"
        ), f"Expected 'Widevine Content Decryption Module', got '{widevine['name']}'"
        assert (
            widevine["description"] == "Provides DRM video playback support."
        ), f"Expected 'Provides DRM video playback support.', got '{widevine['description']}'"
        assert (
            widevine["filename"] == "widevinecdm.dll"
        ), f"Expected 'widevinecdm.dll', got '{widevine['filename']}'"
        assert (
            len(widevine["mimeTypes"]) == 2
        ), f"Expected 2 mime types for Widevine, got {len(widevine['mimeTypes'])}"

        print(f"✓ Widevine plugin: {widevine['name']}")
        for mt in widevine["mimeTypes"]:
            print(f"    - {mt['type']}: {mt['description']}")

        # Verify second plugin (Chrome PDF)
        pdf_plugin = plugins[1]
        assert (
            pdf_plugin["name"] == "Chrome PDF Plugin"
        ), f"Expected 'Chrome PDF Plugin', got '{pdf_plugin['name']}'"
        assert (
            pdf_plugin["description"] == "Portable Document Format"
        ), f"Expected 'Portable Document Format', got '{pdf_plugin['description']}'"
        assert (
            pdf_plugin["filename"] == "internal-pdf-viewer"
        ), f"Expected 'internal-pdf-viewer', got '{pdf_plugin['filename']}'"
        assert (
            len(pdf_plugin["mimeTypes"]) == 1
        ), f"Expected 1 mime type for PDF plugin, got {len(pdf_plugin['mimeTypes'])}"

        print(f"✓ PDF plugin: {pdf_plugin['name']}")
        for mt in pdf_plugin["mimeTypes"]:
            print(f"    - {mt['type']}: {mt['description']} ({mt['suffixes']})")

        print("✓ Test passed")


def test_plugin_methods():
    """Test that plugin methods work correctly."""
    print("\n=== Test 3: Plugin Methods ===")

    custom_config = {
        "navigator.plugins": [
            {
                "name": "Test Plugin",
                "description": "Test Description",
                "filename": "test.so",
                "mimeTypes": [
                    {
                        "type": "application/test",
                        "description": "Test Type",
                        "suffixes": "test",
                    }
                ],
            }
        ]
    }

    with Camoufox(headless=True, debug=False, config=custom_config) as browser:
        page = browser.new_page()
        page.goto("about:blank")

        # Test item() and namedItem() methods
        result = page.evaluate(
            """() => {
            const byIndex = navigator.plugins.item(0);
            const byName = navigator.plugins.namedItem('Test Plugin');
            const nonExistent = navigator.plugins.namedItem('NonExistent');
            
            return {
                byIndexName: byIndex ? byIndex.name : null,
                byNameName: byName ? byName.name : null,
                nonExistent: nonExistent,
                bothMatch: byIndex === byName
            };
        }"""
        )

        assert (
            result["byIndexName"] == "Test Plugin"
        ), "item(0) should return Test Plugin"
        assert (
            result["byNameName"] == "Test Plugin"
        ), "namedItem('Test Plugin') should return Test Plugin"
        assert (
            result["nonExistent"] is None
        ), "namedItem('NonExistent') should return null"

        print("✓ item() method works")
        print("✓ namedItem() method works")
        print("✓ Test passed")


def main():
    """Run all tests."""
    print("=" * 60)
    print("Camoufox Plugin Spoofing Integration Tests")
    print("=" * 60)

    try:
        test_default_plugins()
        test_custom_plugins()
        test_plugin_methods()

        print("\n" + "=" * 60)
        print("✓ All tests passed!")
        print("=" * 60)
        return 0
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
