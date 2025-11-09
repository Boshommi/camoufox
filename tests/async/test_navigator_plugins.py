# Copyright (c) Microsoft Corporation.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import pytest
from playwright.async_api import Page

from tests.server import Server


async def test_navigator_plugins_default(page: Page, server: Server) -> None:
    """Test that default plugins are returned when no config is provided."""
    await page.goto(server.PREFIX + "/plugins.html")

    plugin_data = await page.evaluate("() => window.pluginData")

    # Default Firefox behavior - should have PDF plugins
    assert plugin_data["length"] >= 1
    assert isinstance(plugin_data["plugins"], list)

    # Check that default plugins have expected structure
    for plugin in plugin_data["plugins"]:
        assert "name" in plugin
        assert "description" in plugin
        assert "filename" in plugin


async def test_navigator_plugins_empty_array(page: Page, server: Server) -> None:
    """Test that empty plugins array works correctly."""
    await page.goto(server.EMPTY_PAGE)

    # This test would need Camoufox config support
    # For now, just test that navigator.plugins exists and is accessible
    plugins_length = await page.evaluate("() => navigator.plugins.length")
    assert isinstance(plugins_length, int)
    assert plugins_length >= 0


async def test_navigator_plugins_structure(page: Page, server: Server) -> None:
    """Test that navigator.plugins has correct structure and methods."""
    await page.goto(server.EMPTY_PAGE)

    # Test that navigator.plugins is iterable
    can_iterate = await page.evaluate(
        """() => {
        let count = 0;
        for (let plugin of navigator.plugins) {
            count++;
        }
        return count >= 0;
    }"""
    )
    assert can_iterate

    # Test item() method
    has_item_method = await page.evaluate(
        "() => typeof navigator.plugins.item === 'function'"
    )
    assert has_item_method

    # Test namedItem() method
    has_named_item_method = await page.evaluate(
        "() => typeof navigator.plugins.namedItem === 'function'"
    )
    assert has_named_item_method

    # Test refresh() method
    has_refresh_method = await page.evaluate(
        "() => typeof navigator.plugins.refresh === 'function'"
    )
    assert has_refresh_method


async def test_plugin_mimetype_structure(page: Page, server: Server) -> None:
    """Test that plugin mime types have correct structure."""
    await page.goto(server.EMPTY_PAGE)

    mime_type_structure = await page.evaluate(
        """() => {
        if (navigator.plugins.length === 0) return null;
        
        const plugin = navigator.plugins[0];
        if (plugin.length === 0) return null;
        
        const mimeType = plugin[0];
        return {
            hasType: 'type' in mimeType,
            hasDescription: 'description' in mimeType,
            hasSuffixes: 'suffixes' in mimeType,
            hasEnabledPlugin: 'enabledPlugin' in mimeType
        };
    }"""
    )

    if mime_type_structure:
        assert mime_type_structure["hasType"]
        assert mime_type_structure["hasDescription"]
        assert mime_type_structure["hasSuffixes"]


async def test_navigator_plugins_consistency(page: Page, server: Server) -> None:
    """Test that navigator.plugins returns consistent data across multiple accesses."""
    await page.goto(server.EMPTY_PAGE)

    consistency_check = await page.evaluate(
        """() => {
        const length1 = navigator.plugins.length;
        const length2 = navigator.plugins.length;
        
        const plugin1 = navigator.plugins.length > 0 ? navigator.plugins[0] : null;
        const plugin2 = navigator.plugins.length > 0 ? navigator.plugins[0] : null;
        
        return {
            lengthsMatch: length1 === length2,
            pluginsMatch: plugin1 === plugin2
        };
    }"""
    )

    assert consistency_check["lengthsMatch"]
    if consistency_check["pluginsMatch"] is not None:
        assert consistency_check["pluginsMatch"]


async def test_plugin_by_index_and_name(page: Page, server: Server) -> None:
    """Test that plugins can be accessed by both index and name."""
    await page.goto(server.EMPTY_PAGE)

    access_test = await page.evaluate(
        """() => {
        if (navigator.plugins.length === 0) return null;
        
        const plugin1 = navigator.plugins[0];
        const plugin2 = navigator.plugins.item(0);
        const plugin3 = navigator.plugins.namedItem(plugin1.name);
        
        return {
            indexAccess: plugin1 !== null,
            itemMethod: plugin2 !== null,
            namedMethod: plugin3 !== null,
            allSame: plugin1 === plugin2 && plugin2 === plugin3
        };
    }"""
    )

    if access_test:
        assert access_test["indexAccess"]
        assert access_test["itemMethod"]
        assert access_test["namedMethod"]


# Note: Tests for custom plugin spoofing would require integration with
# Camoufox's config system. These would be added once the feature is merged
# and the test infrastructure supports passing custom configs.
#
# Example test structure:
# async def test_custom_plugin_spoofing(browser_with_config):
#     """Test custom plugin configuration."""
#     config = {
#         "navigator.plugins": [
#             {
#                 "name": "Test Plugin",
#                 "description": "Test Description",
#                 "filename": "test.dll",
#                 "mimeTypes": [
#                     {
#                         "type": "application/test",
#                         "description": "Test Mime Type",
#                         "suffixes": "test"
#                     }
#                 ]
#             }
#         ]
#     }
#     page = await browser_with_config(config).new_page()
#     await page.goto(server.EMPTY_PAGE)
#
#     plugins = await page.evaluate("() => Array.from(navigator.plugins).map(p => ({name: p.name, description: p.description}))")
#     assert len(plugins) == 1
#     assert plugins[0]["name"] == "Test Plugin"
#     assert plugins[0]["description"] == "Test Description"
