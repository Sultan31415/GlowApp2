#!/usr/bin/env python3
"""
Performance testing script for GlowApp backend optimization.
Tests both old and new speed-optimized endpoints.
"""

import asyncio
import time
import json
from typing import Dict, Any, List
from app.models.schemas import QuizAnswer
from app.services.ai_service import AIService
from app.services.scoring_service import ScoringService

# Sample test data
SAMPLE_ANSWERS = [
    QuizAnswer(questionId="q1", value=4, label="Good energy"),
    QuizAnswer(questionId="q2", value=3, label="Fair sleep"),
    QuizAnswer(questionId="q3", value=4, label="Regular exercise"),
    QuizAnswer(questionId="q4", value=3, label="Balanced diet"),
    QuizAnswer(questionId="q5", value="never", label="Never smoked"),
    QuizAnswer(questionId="q6", value=3, label="Moderate stress"),
    QuizAnswer(questionId="q7", value=4, label="Generally happy"),
    QuizAnswer(questionId="q8", value=4, label="Good social support"),
    QuizAnswer(questionId="q9", value=4, label="Often joyful"),
    QuizAnswer(questionId="q10", value=3, label="Satisfied with appearance"),
    QuizAnswer(questionId="q15", value=25, label="25 years old"),
    QuizAnswer(questionId="q16", value="US", label="United States"),
    QuizAnswer(questionId="q17", value="female", label="Female"),
]

SAMPLE_ADDITIONAL_DATA = {
    "chronologicalAge": 25,
    "countryOfResidence": "US",
    "biologicalSex": "female"
}

# Sample base64 photo (1x1 pixel for testing)
SAMPLE_PHOTO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

async def test_ai_service_performance():
    """Test AI service performance with optimized settings"""
    print("🧪 Testing AI Service Performance")
    print("=" * 50)
    
    # Initialize services
    ai_service = AIService()
    scoring_service = ScoringService()
    
    # Calculate base scores
    base_scores = scoring_service.calculate_base_scores(SAMPLE_ANSWERS)
    print(f"✅ Base scores calculated: {base_scores}")
    
    # Test 1: Without photo (Quiz + Orchestration only)
    print("\n📝 Test 1: Quiz + Orchestration (No Photo)")
    start_time = time.time()
    
    try:
        result_no_photo = ai_service.get_ai_analysis(
            answers=SAMPLE_ANSWERS,
            base_scores=base_scores,
            additional_data=SAMPLE_ADDITIONAL_DATA,
            photo_url=None
        )
        
        no_photo_time = time.time() - start_time
        print(f"✅ Quiz-only analysis completed in {no_photo_time:.2f}s")
        print(f"   Overall Glow Score: {result_no_photo.get('overallGlowScore', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Quiz-only test failed: {e}")
        no_photo_time = 999
    
    # Test 2: With photo (Full pipeline)
    print("\n📸 Test 2: Full Pipeline (Quiz + Photo + Orchestration)")
    start_time = time.time()
    
    try:
        result_with_photo = ai_service.get_ai_analysis(
            answers=SAMPLE_ANSWERS,
            base_scores=base_scores,
            additional_data=SAMPLE_ADDITIONAL_DATA,
            photo_url=SAMPLE_PHOTO
        )
        
        with_photo_time = time.time() - start_time
        print(f"✅ Full pipeline completed in {with_photo_time:.2f}s")
        print(f"   Overall Glow Score: {result_with_photo.get('overallGlowScore', 'N/A')}")
        print(f"   Biological Age: {result_with_photo.get('biologicalAge', 'N/A')}")
        
    except Exception as e:
        print(f"❌ Full pipeline test failed: {e}")
        with_photo_time = 999
    
    # Performance Analysis
    print("\n📊 Performance Analysis")
    print("=" * 50)
    
    if no_photo_time < 5:
        print("✅ Quiz-only analysis: EXCELLENT (< 5s)")
    elif no_photo_time < 10:
        print("⚠️  Quiz-only analysis: GOOD (< 10s)")
    else:
        print("❌ Quiz-only analysis: NEEDS IMPROVEMENT (> 10s)")
    
    if with_photo_time < 8:
        print("✅ Full pipeline: EXCELLENT (< 8s)")
    elif with_photo_time < 15:
        print("⚠️  Full pipeline: GOOD (< 15s)")
    else:
        print("❌ Full pipeline: NEEDS IMPROVEMENT (> 15s)")
    
    # Expected performance targets
    print("\n🎯 Performance Targets:")
    print("   Quiz-only: < 3s (Target with optimizations)")
    print("   Full pipeline: < 5s (Target with optimizations)")
    
    return {
        "quiz_only_time": no_photo_time,
        "full_pipeline_time": with_photo_time,
        "performance_grade": "excellent" if with_photo_time < 8 else "good" if with_photo_time < 15 else "needs_improvement"
    }

async def test_individual_components():
    """Test individual components for bottleneck identification"""
    print("\n🔍 Component Performance Testing")
    print("=" * 50)
    
    from app.services.photo_analyzer import PhotoAnalyzerGPT4o
    from app.services.quiz_analyzer import QuizAnalyzerGemini
    from app.services.scoring_service import AdvancedScoringService
    
    # Test scoring service (should be instant)
    print("📊 Testing Scoring Service...")
    start_time = time.time()
    scoring_service = AdvancedScoringService()
    scores = scoring_service.calculate_advanced_scores(SAMPLE_ANSWERS, age=25, country="US")
    scoring_time = time.time() - start_time
    print(f"✅ Scoring completed in {scoring_time:.3f}s")
    
    # Test photo analyzer (fast version)
    print("📸 Testing Fast Photo Analyzer...")
    start_time = time.time()
    photo_analyzer = PhotoAnalyzerGPT4o()
    try:
        photo_result = await photo_analyzer.analyze_photo_fast(SAMPLE_PHOTO)
        photo_time = time.time() - start_time
        print(f"✅ Fast photo analysis completed in {photo_time:.2f}s")
    except Exception as e:
        photo_time = 999
        print(f"❌ Fast photo analysis failed: {e}")
    
    # Test quiz analyzer (fast version)
    print("📝 Testing Fast Quiz Analyzer...")
    start_time = time.time()
    quiz_analyzer = QuizAnalyzerGemini()
    try:
        question_map = {}  # Simplified for testing
        quiz_result = quiz_analyzer.analyze_quiz_fast(SAMPLE_ANSWERS, scores, SAMPLE_ADDITIONAL_DATA, question_map)
        quiz_time = time.time() - start_time
        print(f"✅ Fast quiz analysis completed in {quiz_time:.2f}s")
    except Exception as e:
        quiz_time = 999
        print(f"❌ Fast quiz analysis failed: {e}")
    
    print(f"\n⏱️  Component Breakdown:")
    print(f"   Scoring: {scoring_time:.3f}s")
    print(f"   Photo Analysis: {photo_time:.2f}s")
    print(f"   Quiz Analysis: {quiz_time:.2f}s")
    print(f"   Expected Total: ~{scoring_time + photo_time + quiz_time + 1:.2f}s (+ orchestration)")

def main():
    """Main performance testing function"""
    print("🚀 GlowApp Performance Testing Suite")
    print("=" * 50)
    print("Testing optimized AI pipeline performance...")
    
    # Test individual components first
    asyncio.run(test_individual_components())
    
    # Test full AI service
    results = asyncio.run(test_ai_service_performance())
    
    print("\n" + "=" * 50)
    if results["performance_grade"] == "excellent":
        print("🎉 PERFORMANCE: EXCELLENT! Your optimizations are working.")
    elif results["performance_grade"] == "good":
        print("👍 PERFORMANCE: GOOD. Some room for improvement.")
    else:
        print("⚠️  PERFORMANCE: NEEDS WORK. Check the optimizations.")
    
    print(f"\n💡 Key Recommendations:")
    if results["full_pipeline_time"] > 10:
        print("   • Consider using GPT-4o-mini for photo analysis")
        print("   • Further reduce prompt sizes")
        print("   • Implement request batching")
    if results["quiz_only_time"] > 5:
        print("   • Reduce quiz analysis token limits")
        print("   • Optimize Gemini temperature settings")
    
    print("\n✨ Run this test regularly to monitor performance!")

if __name__ == "__main__":
    main() 