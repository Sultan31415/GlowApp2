"""
Performance configuration for GlowApp AI services.
Adjust these values to optimize speed vs quality trade-offs.
"""

# Token limits for different components (lower = faster)
TOKEN_LIMITS = {
    "photo_analysis_fast": 400,        # Ultra-fast photo analysis
    "photo_analysis_full": 1500,       # Full photo analysis  
    "quiz_analysis_fast": 400,         # Ultra-fast quiz analysis
    "quiz_analysis_full": 2500,        # Full quiz analysis
    "orchestrator_fast": 600,          # Ultra-fast orchestration
    "orchestrator_full": 2048,         # Full orchestration
}

# Temperature settings (lower = faster, more consistent)
TEMPERATURE_SETTINGS = {
    "photo_analysis_fast": 0.1,        # Very consistent
    "photo_analysis_full": 0.3,        # Balanced
    "quiz_analysis_fast": 0.2,         # Consistent
    "quiz_analysis_full": 0.4,         # Creative
    "orchestrator_fast": 0.1,          # Very consistent
    "orchestrator_full": 0.3,          # Balanced
}

# Timeout settings (seconds)
TIMEOUT_SETTINGS = {
    "photo_download": 8,               # Photo download timeout
    "api_request": 15,                 # Individual API request timeout
    "total_pipeline": 30,              # Total pipeline timeout
}

# Cache settings
CACHE_SETTINGS = {
    "enabled": True,                   # Enable caching
    "ttl_seconds": 300,               # 5 minutes cache TTL
    "max_entries": 1000,              # Maximum cache entries
}

# Performance mode settings
PERFORMANCE_MODES = {
    "ultra_fast": {
        "use_fast_methods": True,
        "parallel_processing": True,
        "cache_enabled": True,
        "max_concurrent_requests": 5,
        "description": "Optimized for speed (3-5s response time)"
    },
    "balanced": {
        "use_fast_methods": False,
        "parallel_processing": True,
        "cache_enabled": True,
        "max_concurrent_requests": 3,
        "description": "Balanced speed and quality (5-10s response time)"
    },
    "high_quality": {
        "use_fast_methods": False,
        "parallel_processing": False,
        "cache_enabled": False,
        "max_concurrent_requests": 1,
        "description": "Maximum quality (10-20s response time)"
    }
}

# Current performance mode (change this to adjust system-wide performance)
CURRENT_MODE = "ultra_fast"

def get_current_config():
    """Get current performance configuration"""
    return PERFORMANCE_MODES[CURRENT_MODE]

def get_token_limit(component: str):
    """Get token limit for a component based on current mode"""
    mode = get_current_config()
    if mode["use_fast_methods"]:
        return TOKEN_LIMITS.get(f"{component}_fast", TOKEN_LIMITS.get(component, 600))
    else:
        return TOKEN_LIMITS.get(f"{component}_full", TOKEN_LIMITS.get(component, 1500))

def get_temperature(component: str):
    """Get temperature setting for a component based on current mode"""
    mode = get_current_config()
    if mode["use_fast_methods"]:
        return TEMPERATURE_SETTINGS.get(f"{component}_fast", 0.1)
    else:
        return TEMPERATURE_SETTINGS.get(f"{component}_full", 0.3)

# Quick performance tuning functions
def set_ultra_fast_mode():
    """Set system to ultra-fast mode (3-5s response time)"""
    global CURRENT_MODE
    CURRENT_MODE = "ultra_fast"
    print("🚀 Performance mode: ULTRA-FAST (3-5s response time)")

def set_balanced_mode():
    """Set system to balanced mode (5-10s response time)"""
    global CURRENT_MODE
    CURRENT_MODE = "balanced"
    print("⚖️  Performance mode: BALANCED (5-10s response time)")

def set_high_quality_mode():
    """Set system to high-quality mode (10-20s response time)"""
    global CURRENT_MODE
    CURRENT_MODE = "high_quality"
    print("💎 Performance mode: HIGH-QUALITY (10-20s response time)")

def print_current_settings():
    """Print current performance settings"""
    config = get_current_config()
    print(f"\n⚙️  Current Performance Settings:")
    print(f"   Mode: {CURRENT_MODE.upper()}")
    print(f"   Description: {config['description']}")
    print(f"   Fast Methods: {'✅' if config['use_fast_methods'] else '❌'}")
    print(f"   Parallel Processing: {'✅' if config['parallel_processing'] else '❌'}")
    print(f"   Cache Enabled: {'✅' if config['cache_enabled'] else '❌'}")
    print(f"   Max Concurrent: {config['max_concurrent_requests']}")
    print(f"   Token Limits: Photo={get_token_limit('photo_analysis')}, Quiz={get_token_limit('quiz_analysis')}, Orchestrator={get_token_limit('orchestrator')}") 