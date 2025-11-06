from __future__ import annotations

from typing import Any, Dict, Union

_UNSET = object()


def _build_payload(
    *,
    enabled: Union[bool, None, object] = _UNSET,
    charging: Union[bool, None, object] = _UNSET,
    level: Union[float, int, None, object] = _UNSET,
    charging_time: Union[float, int, None, object] = _UNSET,
    discharging_time: Union[float, int, None, object] = _UNSET,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {}

    if enabled is not _UNSET:
        if enabled is not None and not isinstance(enabled, bool):
            raise TypeError("enabled must be a bool or None")
        payload["enabled"] = enabled

    if charging is not _UNSET:
        if charging is not None and not isinstance(charging, bool):
            raise TypeError("charging must be a bool or None")
        payload["charging"] = charging

    if level is not _UNSET:
        if level is None:
            payload["level"] = None
        elif isinstance(level, (int, float)):
            payload["level"] = float(level)
        else:
            raise TypeError("level must be a float, int, or None")

    if charging_time is not _UNSET:
        if charging_time is None:
            payload["chargingTime"] = None
        elif isinstance(charging_time, (int, float)):
            payload["chargingTime"] = float(charging_time)
        else:
            raise TypeError("charging_time must be a float, int, or None")

    if discharging_time is not _UNSET:
        if discharging_time is None:
            payload["dischargingTime"] = None
        elif isinstance(discharging_time, (int, float)):
            payload["dischargingTime"] = float(discharging_time)
        else:
            raise TypeError("discharging_time must be a float, int, or None")

    return payload


def _get_browser_channel(target: Any):
    impl = getattr(target, "_impl_obj", target)
    browser_impl = getattr(impl, "_browser", None)
    if browser_impl is not None:
        impl = browser_impl

    channel = getattr(impl, "_channel", None)
    if channel is None:
        raise TypeError(
            "Cannot resolve browser channel from target; expected a Browser or BrowserContext"
        )
    return channel


def set_battery(
    target: Any,
    *,
    enabled: Union[bool, None, object] = _UNSET,
    charging: Union[bool, None, object] = _UNSET,
    level: Union[float, int, None, object] = _UNSET,
    charging_time: Union[float, int, None, object] = _UNSET,
    discharging_time: Union[float, int, None, object] = _UNSET,
) -> None:
    """
    Update the Battery Status API overrides for the entire browser.

    Pass `None` to clear a specific override, or omit the keyword argument to
    leave it unchanged. Calling without any keyword arguments clears all
    overrides and falls back to the launch-time fingerprint.
    """
    payload = _build_payload(
        enabled=enabled,
        charging=charging,
        level=level,
        charging_time=charging_time,
        discharging_time=discharging_time,
    )

    channel = _get_browser_channel(target)
    if payload:
        channel.send("Browser.setBatteryOverride", payload)
    else:
        channel.send("Browser.setBatteryOverride")


async def async_set_battery(
    target: Any,
    *,
    enabled: Union[bool, None, object] = _UNSET,
    charging: Union[bool, None, object] = _UNSET,
    level: Union[float, int, None, object] = _UNSET,
    charging_time: Union[float, int, None, object] = _UNSET,
    discharging_time: Union[float, int, None, object] = _UNSET,
) -> None:
    """
    Async counterpart to :func:`set_battery`.
    """
    payload = _build_payload(
        enabled=enabled,
        charging=charging,
        level=level,
        charging_time=charging_time,
        discharging_time=discharging_time,
    )

    channel = _get_browser_channel(target)
    if payload:
        await channel.send("Browser.setBatteryOverride", payload)
    else:
        await channel.send("Browser.setBatteryOverride")
