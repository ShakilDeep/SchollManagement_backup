from django.core.cache import cache
from typing import Any, Callable
import hashlib
import json


def cache_key_generator(prefix: str, *args, **kwargs) -> str:
    key_parts = [prefix]
    if args:
        key_parts.extend(str(arg) for arg in args)
    if kwargs:
        sorted_kwargs = json.dumps(kwargs, sort_keys=True)
        key_parts.append(sorted_kwargs)
    key_string = ':'.join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def cached_query(timeout: int = 300, key_prefix: str = 'query'):
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            cache_key = cache_key_generator(key_prefix, *args, **kwargs)
            result = cache.get(cache_key)
            if result is not None:
                return result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator


def invalidate_model_cache(model_name: str, instance_id: str = None):
    if instance_id:
        cache.delete(f"{model_name}:{instance_id}")
    cache.delete(f"{model_name}:all")
