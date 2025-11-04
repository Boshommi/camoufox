from camoufox import Camoufox, DefaultAddons

# Change this to your actual .app binary:
EXEC = "dist/Camoufox.app/Contents/MacOS/camoufox"

with Camoufox(
    executable_path=EXEC,
    ff_version=144,
    exclude_addons=[DefaultAddons.UBO],
    os=("windows"),
    debug=True,
    config={
        # Don't set net-info-api at all to test if the API is available by default
    },
) as browser:
    page = browser.new_page()
    page.goto("about:blank")

    # Check if the API exists
    result = page.evaluate(
        """() => {
        return {
            hasConnection: typeof navigator.connection !== 'undefined',
            prefEnabled: navigator.connection ? true : false,
            connectionType: navigator.connection ? navigator.connection.type : null,
            hasEffectiveType: navigator.connection ? ('effectiveType' in navigator.connection) : false,
            hasDownlink: navigator.connection ? ('downlink' in navigator.connection) : false,
            effectiveType: navigator.connection ? navigator.connection.effectiveType : null,
            downlink: navigator.connection ? navigator.connection.downlink : null,
            rtt: navigator.connection ? navigator.connection.rtt : null
        }
    }"""
    )

    print("=== Network Information API Test ===")
    print(f"Has navigator.connection: {result['hasConnection']}")
    print(f"Connection object exists: {result['prefEnabled']}")
    print(f"Connection type: {result['connectionType']}")
    print(f"Has effectiveType property: {result['hasEffectiveType']}")
    print(f"Has downlink property: {result['hasDownlink']}")
    print(f"Effective type value: {result['effectiveType']}")
    print(f"Downlink value: {result['downlink']}")
    print(f"RTT value: {result['rtt']}")

    if not result["hasConnection"]:
        print("\n❌ ERROR: navigator.connection is undefined!")
        print("This means either:")
        print("1. The binary wasn't built with the patch")
        print("2. The dom.netinfo.enabled preference is false")
        print("3. You're using an old binary")
    elif not result["hasEffectiveType"]:
        print("\n⚠️  WARNING: Basic API exists but new properties are missing!")
        print("The patch may not be fully applied")
    else:
        print("\n✅ SUCCESS: Network Information API is fully working!")
