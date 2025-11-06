from .addons import DefaultAddons
from .async_api import AsyncCamoufox, AsyncNewBrowser
from .battery import async_set_battery, set_battery
from .sync_api import Camoufox, NewBrowser
from .utils import launch_options

__all__ = [
    "Camoufox",
    "NewBrowser",
    "AsyncCamoufox",
    "AsyncNewBrowser",
    "DefaultAddons",
    "async_set_battery",
    "set_battery",
    "launch_options",
]
