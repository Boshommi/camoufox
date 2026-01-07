#!/bin/bash
# Run Camoufox with config directly (see errors in terminal)

export CAMOU_CONFIG_1='{
  "navigator.userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
  "navigator.vendor": "Apple Computer, Inc.",
  "navigator.vendorSub": "",
  "navigator.webdriver": false,
  "navigator.userAgentData": false,
  "window.InstallTrigger:hide": true,
  "window.webkit": true,
  "navigator.plugins": [],
  "navigator.platform": "iPhone",
  "navigator.language": "en-US",
  "navigator.languages": ["en-US"],
  "screen.width": 440,
  "screen.height": 956,
  "window.devicePixelRatio": 3
}'

# Run browser - errors will show in terminal
./dist/Camoufox.app/Contents/MacOS/camoufox "$@"
