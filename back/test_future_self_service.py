import asyncio
from app.services.future_self_service import FutureSelfService

# Sample/mock data
orchestrator_output = {
    "overallGlowScore": 72,
    "adjustedCategoryScores": {
        "physicalVitality": 70,
        "emotionalHealth": 75,
        "visualAppearance": 68
    },
    "biologicalAge": 29,
    "emotionalAge": 28,
    "chronologicalAge": 30,
    "glowUpArchetype": {
        "name": "You are like Zendaya in her 'Euphoria' era",
        "description": "Inspirational narrative here."
    },
    "analysisSummary": "Comprehensive summary here.",
    "detailedInsightsPerCategory": {
        "physicalVitalityInsights": ["Good exercise habits."],
        "emotionalHealthInsights": ["Strong emotional resilience."],
        "visualAppearanceInsights": ["Healthy skin, minor redness."]
    }
}

quiz_insights = {
    "adjustedScores": {
        "physicalVitality": 70,
        "emotionalHealth": 75,
        "visualAppearance": 68
    },
    "keyStrengths": ["Consistent sleep", "Balanced diet"],
    "priorityAreas": ["Increase hydration"],
    "culturalContext": "Western Europe"
}

photo_insights = {
    "skinAnalysis": {
        "overallSkinHealth": "Good",
        "redness": "Minor"
    },
    "stressAndTirednessIndicators": {
        "skinToneAndLuster": "Healthy",
        "eyes": "Bright"
    },
    "estimatedAgeRange": {"lower": 28, "upper": 32}
}

async def main():
    service = FutureSelfService()
    result = await service.get_7_day_projection(
        orchestrator_output, quiz_insights, photo_insights
    )
    print("Future Self 7-Day Projection Result:")
    print(result)

async def test_get_7_day_personalized_plan():
    service = FutureSelfService()
    result = await service.get_7_day_personalized_plan(
        orchestrator_output, quiz_insights, photo_insights, user_name="TestUser"
    )
    print("\nFuture Self 7-Day Personalized Plan Result:")
    print(result)

# To run both tests
if __name__ == "__main__":
    asyncio.run(main())
    asyncio.run(test_get_7_day_personalized_plan()) 