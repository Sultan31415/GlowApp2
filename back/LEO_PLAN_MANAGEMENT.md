# Leo Plan Management Capabilities

## Overview

Leo, your AI wellness mentor, now has the ability to make operations on your daily plans and morning routines. This allows for dynamic, personalized plan adjustments based on your needs and preferences.

## New Capabilities

### 1. Morning Routine Management
**Tool**: `update_morning_routine(new_routine: List[str])`

Leo can modify your morning routine for the entire week. This affects all days of your plan.

**Example Usage**:
- "Leo, I want to change my morning routine to include meditation"
- "Can you update my morning routine to be more focused on exercise?"
- "I need a simpler morning routine with just 3 steps"

### 2. Specific Day Plan Updates
**Tool**: `update_specific_day_plan(day_number: int, updates: Dict[str, Any])`

Leo can modify specific days of your weekly plan. You can update:
- Main focus for the day
- System building activities
- Deep focus tasks
- Evening reflection
- Motivational tips

**Example Usage**:
- "Leo, I want to change Monday's focus to be more about stress management"
- "Can you update Wednesday's deep focus to be about project planning?"
- "I need Friday's plan to be lighter and more relaxing"

### 3. Weekly Challenges Updates
**Tool**: `update_weekly_challenges(new_challenges: List[str])`

Leo can modify your weekly challenges to better align with your current goals.

**Example Usage**:
- "Leo, I want different weekly challenges that focus on sleep improvement"
- "Can you give me challenges that are more social and relationship-focused?"
- "I need simpler challenges that I can actually complete"

### 4. Complete Plan Regeneration
**Tool**: `regenerate_daily_plan()`

Leo can generate a completely new 7-day plan based on your current assessment data and preferences.

**Example Usage**:
- "Leo, I need a completely new plan - my current one isn't working"
- "Can you regenerate my plan with a different approach?"
- "I want a fresh start with my daily planning"

## How It Works

1. **User Request**: You ask Leo to modify your plan in natural language
2. **Leo's Analysis**: Leo understands your request and determines which tool to use
3. **Confirmation**: Leo confirms the changes with you before making them
4. **Execution**: Leo uses the appropriate tool to update your plan
5. **Verification**: Leo confirms the changes were successful and explains the impact

## Safety Features

- **Confirmation Required**: Leo always confirms changes before making them
- **Error Handling**: If something goes wrong, Leo will explain the issue and suggest alternatives
- **Data Integrity**: All changes are properly saved and backed up
- **User Control**: You can always ask Leo to revert changes or generate a new plan

## Example Conversations

### Morning Routine Update
**User**: "Leo, I want to change my morning routine to be more focused on energy and motivation"

**Leo**: "I'd be happy to help you update your morning routine! Let me first check your current routine and then suggest some energy-focused activities that align with your wellness goals. Would you like me to update it with activities like:
- 5 minutes of energizing stretching
- A quick cold shower or splash
- Positive affirmations for motivation
- A protein-rich breakfast focus

Should I proceed with these changes?"

### Day-Specific Update
**User**: "Leo, I want Monday's plan to be more focused on stress management"

**Leo**: "I understand you want to shift Monday's focus to stress management. Let me check your current Monday plan and suggest some stress-reducing activities that would work well for the start of your week. This could include:
- Gentle morning meditation
- Stress-reducing breathing exercises
- Light yoga or stretching
- Planning your week with less pressure

Would you like me to update Monday's plan with these stress management activities?"

## Integration with Existing Features

These new plan management capabilities work seamlessly with Leo's existing features:

- **AI Insights**: Changes are informed by your assessment data and wellness insights
- **Pattern Recognition**: Leo considers your habits and preferences when suggesting changes
- **Therapeutic Approach**: Changes are made with your emotional and mental wellness in mind
- **Progress Tracking**: All changes are tracked and can be referenced in future conversations

## Best Practices

1. **Be Specific**: The more specific your request, the better Leo can help
2. **Consider Your Goals**: Think about what you're trying to achieve with the change
3. **Start Small**: Consider making one change at a time to see how it works
4. **Give Feedback**: Let Leo know how the changes are working for you
5. **Be Patient**: Some changes may take time to show their full benefits

## Technical Implementation

The plan management tools are built using Pydantic AI's agent framework and integrate with your existing database structure. All changes are:

- **Atomic**: Changes are either fully applied or not at all
- **Tracked**: All modifications are logged with timestamps
- **Reversible**: You can always ask Leo to revert or modify changes
- **Consistent**: Changes maintain the integrity of your plan structure

---

*Remember: Leo is here to help you create a plan that works for your unique needs and lifestyle. Don't hesitate to ask for adjustments as your needs change!* 