"""
Backward-compatibility alias forwarding to stardrift.
"""
from stardrift.wsgi import application

__all__ = ["application"]
