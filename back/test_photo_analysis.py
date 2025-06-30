#!/usr/bin/env python3
"""
Test script for photo analysis improvements.
Usage: python test_photo_analysis.py <photo_path_or_url>
"""

import asyncio
import os
import sys
import json
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.services.photo_analyzer import PhotoAnalyzerGPT4o
from app.config.settings import settings

async def test_photo_analysis(photo_path_or_url: str):
    """Test photo analysis with different modes"""
    print("=" * 80)
    print("🔬 PHOTO ANALYSIS TEST SUITE")
    print("=" * 80)
    print(f"Photo: {photo_path_or_url}")
    print(f"Current PHOTO_ANALYSIS_MODE: {settings.PHOTO_ANALYSIS_MODE}")
    print()
    
    # Initialize photo analyzer
    analyzer = PhotoAnalyzerGPT4o()
    
    # Convert file path to data URL if it's a local file
    if os.path.exists(photo_path_or_url):
        import base64
        with open(photo_path_or_url, "rb") as f:
            image_data = f.read()
        encoded = base64.b64encode(image_data).decode()
        # Detect mime type
        if photo_path_or_url.lower().endswith('.png'):
            mime_type = "image/png"
        elif photo_path_or_url.lower().endswith('.jpg') or photo_path_or_url.lower().endswith('.jpeg'):
            mime_type = "image/jpeg"
        else:
            mime_type = "image/jpeg"  # default
        photo_url = f"data:{mime_type};base64,{encoded}"
    else:
        photo_url = photo_path_or_url
    
    # Test all three analysis modes
    modes = [
        ("FAST", "analyze_photo_fast"),
        ("COMPREHENSIVE", "analyze_photo_async"), 
        ("DERMATOLOGICAL", "analyze_photo_dermatological")
    ]
    
    results = {}
    
    for mode_name, method_name in modes:
        print(f"\n📸 Testing {mode_name} Analysis")
        print("-" * 40)
        
        try:
            method = getattr(analyzer, method_name)
            if asyncio.iscoroutinefunction(method):
                result = await method(photo_url)
            else:
                result = method(photo_url)
            
            if result:
                # Extract key skin analysis results
                skin_analysis = result.get('comprehensiveSkinAnalysis', {})
                overall_health = skin_analysis.get('overallSkinHealth', 'N/A')
                skin_concerns = skin_analysis.get('skinConcerns', {})
                redness = skin_concerns.get('redness', 'N/A')
                acne = skin_concerns.get('acne', 'N/A')
                
                # Handle dermatological format
                if 'dermatologicalAssessment' in result:
                    derm = result['dermatologicalAssessment']
                    overall_health = derm.get('overallSkinHealth', 'N/A')
                    redness = derm.get('skinConditions', {}).get('redness', {}).get('severity', 'N/A')
                    acne = derm.get('skinConditions', {}).get('acne', {}).get('severity', 'N/A')
                
                age_range = result.get('ageAssessment', {}).get('estimatedRange', {})
                age_str = f"{age_range.get('lower', '?')}-{age_range.get('upper', '?')}"
                
                print(f"✅ Overall Skin Health: {overall_health}")
                print(f"🔴 Redness Level: {redness}")
                print(f"🔘 Acne Status: {acne}")
                print(f"🎂 Age Estimate: {age_str}")
                
                results[mode_name] = {
                    'overall_health': overall_health,
                    'redness': redness,
                    'acne': acne,
                    'age': age_str,
                    'full_result': result
                }
            else:
                print("❌ Analysis failed - returned None")
                results[mode_name] = None
                
        except Exception as e:
            print(f"❌ Analysis failed with error: {e}")
            results[mode_name] = None
    
    # Summary comparison
    print("\n" + "=" * 80)
    print("📊 SUMMARY COMPARISON")
    print("=" * 80)
    print(f"{'Mode':<15} {'Skin Health':<12} {'Redness':<12} {'Acne':<15} {'Age':<8}")
    print("-" * 70)
    
    for mode_name in ["FAST", "COMPREHENSIVE", "DERMATOLOGICAL"]:
        result = results.get(mode_name)
        if result:
            print(f"{mode_name:<15} {result['overall_health']:<12} {result['redness']:<12} {result['acne']:<15} {result['age']:<8}")
        else:
            print(f"{mode_name:<15} {'FAILED':<12} {'FAILED':<12} {'FAILED':<15} {'FAILED':<8}")
    
    print("\n💡 RECOMMENDATIONS:")
    print("- Check which mode best identifies visible skin conditions")
    print("- DERMATOLOGICAL mode should be most accurate for skin issues")
    print("- Compare results against what you can visually see in the photo")
    
    return results

def main():
    if len(sys.argv) != 2:
        print("Usage: python test_photo_analysis.py <photo_path_or_url>")
        print("Example: python test_photo_analysis.py photo.jpg")
        print("Example: python test_photo_analysis.py https://example.com/photo.jpg")
        sys.exit(1)
    
    photo_input = sys.argv[1]
    asyncio.run(test_photo_analysis(photo_input))

if __name__ == "__main__":
    main() 