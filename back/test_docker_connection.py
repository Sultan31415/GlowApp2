#!/usr/bin/env python3
"""
Test script to verify Docker service connections
"""

import requests
import os
import sys

def test_backend_connection():
    """Test connection to backend service"""
    print("🔍 Testing backend connection...")
    
    # Test different URLs
    urls = [
        "http://localhost:8000/health",
        "http://backend:8000/health",
        "http://glowapp-backend:8000/health"
    ]
    
    for url in urls:
        try:
            print(f"  Testing: {url}")
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"  ✅ SUCCESS: {url}")
                return url.replace("/health", "")
            else:
                print(f"  ❌ Failed: {url} (Status: {response.status_code})")
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Connection failed: {url}")
        except Exception as e:
            print(f"  ❌ Error: {url} - {e}")
    
    return None

def test_telegram_endpoints(base_url):
    """Test telegram endpoints"""
    print(f"\n🔍 Testing telegram endpoints with base URL: {base_url}")
    
    endpoints = [
        "/api/telegram/generate-login-code",
        "/api/telegram/auth",
        "/api/telegram/status/123456789"
    ]
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        try:
            if "generate-login-code" in endpoint or "auth" in endpoint:
                response = requests.post(url, json={}, timeout=5)
            else:
                response = requests.get(url, timeout=5)
            
            print(f"  {endpoint}: {response.status_code}")
            
            if response.status_code in [401, 403]:
                print(f"    ✅ Expected (authentication required)")
            elif response.status_code == 200:
                print(f"    ✅ Success")
            else:
                print(f"    ⚠️ Unexpected: {response.text[:100]}")
                
        except Exception as e:
            print(f"  {endpoint}: ❌ Error - {e}")

def check_environment():
    """Check environment variables"""
    print("\n🔍 Checking environment...")
    
    env_vars = [
        'DOCKER_ENV',
        'HOSTNAME',
        'KUBERNETES_SERVICE_HOST'
    ]
    
    for var in env_vars:
        value = os.getenv(var)
        print(f"  {var}: {value}")
    
    # Check for Docker indicators
    docker_indicators = [
        '/.dockerenv',
        '/proc/1/cgroup'
    ]
    
    for indicator in docker_indicators:
        exists = os.path.exists(indicator)
        print(f"  {indicator}: {exists}")

def main():
    """Main test function"""
    print("🚀 Docker Connection Test")
    print("=" * 50)
    
    check_environment()
    
    # Test backend connection
    base_url = test_backend_connection()
    
    if base_url:
        test_telegram_endpoints(base_url)
    else:
        print("\n❌ Could not connect to backend service")
        print("Make sure the Docker containers are running:")
        print("  docker-compose up -d")
    
    print("\n" + "=" * 50)
    print("🎯 Test Complete!")

if __name__ == "__main__":
    main() 