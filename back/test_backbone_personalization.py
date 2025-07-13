import asyncio
from app.services.future_self_service import FutureSelfService
from app.data.quiz_data import quiz_data

# Helper to generate answers for a given value (best, worst, average)
def generate_answers(value):
    answers = []
    for section in quiz_data:
        for q in section["questions"]:
            if q["type"] == "single-choice":
                # For best: pick highest value; for worst: lowest; for average: middle
                options = q["options"]
                if value == "best":
                    ans = options[0]["value"] if isinstance(options[0]["value"], int) else options[0]["value"]
                elif value == "worst":
                    ans = options[-1]["value"] if isinstance(options[-1]["value"], int) else options[-1]["value"]
                else:  # average
                    mid = len(options) // 2
                    ans = options[mid]["value"] if isinstance(options[mid]["value"], int) else options[mid]["value"]
                answers.append({"questionId": q["id"], "value": ans})
            elif q["type"] == "number-input":
                if value == "best":
                    ans = q.get("max", 100)
                elif value == "worst":
                    ans = q.get("min", 13)
                else:
                    ans = (q.get("min", 13) + q.get("max", 100)) // 2
                answers.append({"questionId": q["id"], "value": ans})
            elif q["type"] == "select-country":
                # Just pick a country
                ans = q["options"][0]["value"]
                answers.append({"questionId": q["id"], "value": ans})
    return answers

async def test_backbone_personalization():
    service = FutureSelfService()
    scenarios = [
        ("Best", generate_answers("best")),
        ("Worst", generate_answers("worst")),
        ("Average", generate_answers("average")),
    ]
    quiz_insights = {}  # You can mock more detailed insights if needed
    photo_insights = {}  # You can mock more detailed insights if needed
    for label, answers in scenarios:
        orchestrator_output = {"answers": answers}  # Minimal mock; real system may use more
        print(f"\n=== {label} Answers ===")
        projection = await service.get_dual_timeframe_projection(orchestrator_output, quiz_insights, photo_insights)
        backbone = projection.get("weeklyBackbone")
        print(f"Backbone for {label}:")
        import json
        print(json.dumps(backbone, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(test_backbone_personalization()) 