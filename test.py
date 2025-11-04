from camoufox import Camoufox, DefaultAddons
import time

# Change this to your actual .app binary:
EXEC = "dist/Camoufox.app/Contents/MacOS/camoufox"  # not the .app folder

with Camoufox(
    executable_path=EXEC,
    ff_version=144,  # matches your 142.x build
    exclude_addons=[DefaultAddons.UBO],  # prevent auto-downloads
    os=("windows"),
    debug=True,
    config={
        "timezone": "Europe/Helsinki",
        # Network Information API spoofing
        # Set to False to disable the API entirely
        # "net-info-api": False,
        # Or customize the returned values:
        "net-info-api": True,
        "net-info-api:type": "wifi",  # cellular, bluetooth, ethernet, wifi, other, none, unknown
        "net-info-api:effectiveType": "4g",  # slow-2g, 2g, 3g, 4g
        "net-info-api:downlink": 10.0,  # Mbps
        "net-info-api:downlinkMax": float(
            "inf"
        ),  # Mbps (use float('inf') for infinity)
        "net-info-api:rtt": 50.0,  # milliseconds
        "net-info-api:saveData": False,  # boolean
    },
) as browser:
    page = browser.new_page()
    page.goto("https://pixelscan.net/fingerprint-check")
    time.sleep(1000000)  # import time
