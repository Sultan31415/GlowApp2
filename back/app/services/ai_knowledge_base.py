# back/app/services/ai_knowledge_base.py

# --- ATOMIC HABITS by James Clear ---
ATOMIC_HABITS_PRINCIPLES = {
    "title": "Atomic Habits by James Clear",
    "core_concept": "Focus on making small, 1% improvements daily through a systematic approach to habit formation. Success is the product of daily habits, not once-in-a-lifetime transformations.",
    "primary_application_area": "Building and breaking habits, designing systems for consistency, behavior change.",
    "four_laws_good_habit": {
        "1_cue": "Make it obvious. (Strategies: Design your environment, use visual cues, habit stacking. Example: Place running shoes by the door for a morning run.)",
        "2_craving": "Make it attractive. (Strategies: Temptation bundling, join a culture where your desired behavior is normal, reframe your mindset. Example: Only watch your favorite show while exercising.)",
        "3_response": "Make it easy. (Strategies: Reduce friction, use the 2-minute rule, automate habits. Example: Prepare tomorrow's healthy lunch tonight; meditate for just 2 minutes.)",
        "4_reward": "Make it satisfying. (Strategies: Use habit trackers, give yourself an immediate, small reward. Example: Check off a box on a calendar after a workout, have a small, non-food reward.)"
    },
    "four_laws_bad_habit": {
        "1_cue": "Make it invisible. (Strategies: Remove cues from your environment. Example: Hide unhealthy snacks in an opaque container in a hard-to-reach cupboard.)",
        "2_craving": "Make it unattractive. (Strategies: Highlight the long-term downsides of the habit, reframe the association. Example: Remind yourself of the sluggishness after eating junk food.)",
        "3_response": "Make it difficult. (Strategies: Increase friction, use commitment devices. Example: Unplug your TV and put the remote in a drawer; set software to block distracting websites.)",
        "4_reward": "Make it unsatisfying. (Strategies: Create immediate costs for bad habits, get an accountability partner. Example: Donate money to an organization you dislike every time you miss a goal.)"
    },
    "key_ideas": [
        "Forget goals, focus on systems. (Goals are about the results you want to achieve, systems are about the processes that lead to those results.)",
        "Build identity-based habits: become the type of person you want to be. (Shift your focus from what you want to achieve to who you wish to become. Example: 'I am a reader' instead of 'I want to read a book.')",
        "Habit stacking: Link a new habit to an existing one. (Formula: 'After [CURRENT HABIT], I will [NEW HABIT].' Example: 'After I pour my morning coffee, I will meditate for one minute.')",
        "The 2-minute rule: When you start a new habit, it should take less than two minutes to do. (Makes starting easy, overcoming inertia. Example: 'Go to the gym for 2 minutes' often leads to longer workouts.)",
        "Compounding effect: Small improvements, done consistently, lead to remarkable results over time."
    ],
    "practical_applications": [
        "Environmental design for habit cues.",
        "Using visual habit trackers (e.g., 'Don't break the chain').",
        "Implementing commitment devices.",
        "Auditing current habits to understand triggers."
    ]
}

# --- THE MIRACLE MORNING by Hal Elrod ---
MIRACLE_MORNING_PRINCIPLES = {
    "title": "The Miracle Morning by Hal Elrod",
    "core_concept": "Transform your life by dedicating the first hour of your day to personal development and self-mastery through six key practices, known as Life S.A.V.E.R.S.",
    "primary_application_area": "Establishing powerful morning routines, personal growth, daily intentionality, mindset shaping.",
    "life_savers": {
        "S": {
            "name": "Silence",
            "description": "Start with focused quiet time to calm your mind and find clarity. Practices include meditation, prayer, deep breathing, or simple reflection.",
            "example": "Meditate for 5-10 minutes, focusing on your breath to quiet internal chatter."
        },
        "A": {
            "name": "Affirmations",
            "description": "Program your subconscious mind for success by repeating positive, empowering statements about who you are and what you're committed to achieving.",
            "example": "Recite affirmations like 'I am fully capable of achieving my goals' or 'I am committed to my well-being.'"
        },
        "V": {
            "name": "Visualization",
            "description": "Mentally rehearse your ideal day, visualize your goals as already achieved, and imagine yourself overcoming challenges.",
            "example": "Spend 5-10 minutes vividly imagining your desired future, feeling the emotions of success."
        },
        "E": {
            "name": "Exercise",
            "description": "Engage in physical activity to boost energy, improve health, and sharpen mental focus. Can be short and intense or gentle.",
            "example": "Do a quick 5-10 minute workout (stretching, jumping jacks, light yoga) to wake up your body."
        },
        "R": {
            "name": "Reading",
            "description": "Gain knowledge and insights by reading non-fiction, self-help, or educational books to accelerate your personal growth.",
            "example": "Read 10-20 pages of a book that inspires or educates you."
        },
        "S": {
            "name": "Scribing",
            "description": "Journaling to clarify thoughts, express gratitude, record ideas, or plan your day. Helps process emotions and gain perspective.",
            "example": "Write in a journal for 5-10 minutes, reflecting on gratitude or outlining your top priorities for the day."
        }
    },
    "key_ideas": [
        "Early rising creates dedicated, uninterrupted time for self-improvement before daily distractions begin.",
        "Consistency is key: practicing SAVERS daily, even for short durations (e.g., 6 minutes - 1 minute per SAVER), compounds over time.",
        "The morning routine sets the tone for the entire day, leading to increased productivity and positivity."
    ],
    "practical_applications": [
        "Setting your alarm 30-60 minutes earlier.",
        "Preparing your SAVERS materials the night before.",
        "Finding an accountability partner for your morning routine."
    ]
}

# --- DEEP WORK by Cal Newport ---
DEEP_WORK_PRINCIPLES = {
    "title": "Deep Work by Cal Newport",
    "core_concept": "The ability to focus without distraction on a cognitively demanding task. It's a rare and valuable skill that leads to elite-level output and personal fulfillment by maximizing cognitive performance.",
    "primary_application_area": "Focused productivity, attention management, cognitive task execution, skill mastery, eliminating distractions.",
    "key_ideas": [
        "Schedule and protect blocks of time for deep, focused work (e.g., 90-120 minute sessions). Treat these deep work blocks like non-negotiable appointments on your calendar.",
        "Minimize shallow work (e.g., constant email checking, social media Browse, endless meetings, administrative tasks). Batch these less demanding tasks to specific, limited times.",
        "Embrace boredom and train your ability to concentrate. Resist the urge for instant gratification or distraction when attention wanes; learn to be comfortable with sustained focus.",
        "Create rituals to signal the start of a deep work session (e.g., specific location, particular music, specific beverage, turning off all notifications). These rituals help your brain shift into a deep state.",
        "Choose a deep work philosophy: Monastic (long retreats from distraction), Bimodal (specific days dedicated to deep work), Rhythmic (daily deep work blocks), Journalistic (opportunistic deep work whenever time allows)."
    ],
    "practical_strategies": [
        "Time blocking your entire day, including shallow work and breaks.",
        "Setting strict boundaries for communication (e.g., only checking email at specific times).",
        "Practicing productive meditation (focused thinking during walks, runs, or chores).",
        "Measuring your deep work output.",
        "Scheduling intentional breaks, but ensuring they are true breaks, not shallow work disguised as breaks."
    ],
    "anti_patterns": [
        "Constant context-switching between tasks.",
        "Multitasking (especially digital).",
        "Mindless internet Browse or social media consumption as a default activity.",
        "Working long hours without concentrated effort."
    ]
}






BOOK_KNOWLEDGE_BASE = {
    "atomic_habits": ATOMIC_HABITS_PRINCIPLES,
    "miracle_morning": MIRACLE_MORNING_PRINCIPLES,
    "deep_work": DEEP_WORK_PRINCIPLES,
}




DAILY_ROUTINE_FRAME = {
    "morning": {
        "label": "Launchpad",
        "source": "Miracle Morning",
        "goal": "Activate clarity, focus, and motivation"
    },
    "system_building": {
        "label": "Behavior Engine",
        "source": "Atomic Habits",
        "goal": "Build/replace habits using small actions"
    },
    "deep_focus": {
        "label": "Execution Window",
        "source": "Deep Work",
        "goal": "Produce meaningful output via deep focus"
    },
    "evening": {
        "label": "Reflection",
        "source": "Combination",
        "goal": "Review progress, reinforce identity"
    }
}


