import requests
import json
import uuid

API_URL = "http://localhost:8000/analyze"

def generate_id():
    return str(uuid.uuid4())

def run_test():
    print("--- Starting Bot Swarm Logic Test ---")

    # 1. Define 'Bot Swarm' comments
    # Same narrative, slightly different wording to test semantic similarity (Layer 3)
    # They also use "AI Hedging" (Layer 2)
    swarm_narrative = [
        "It is important to note that the complex tapestry of this situation requires a nuanced approach.",
        "We must delve into the complex tapestry of the situation, as it is important to note the nuances.",
        "A nuanced approach is required. It is important to note the complex tapestry involved here.",
        "As we delve into this, it is important to note that a complex tapestry of factors is at play.",
        "This situation is a complex tapestry. It is important to note that a nuanced approach is vital."
    ]

    # 2. Define a Human comment
    human_comment = "lol this meme is actually hilarious, i spilled my coffee."

    # 3. Build Payload
    comments = []
    
    # Add Swarm
    for i, text in enumerate(swarm_narrative):
        comments.append({
            "id": generate_id(),
            "author": f"bot_user_{i}",
            "text": text,
            "account_age_days": 10, # Layer 1 Trigger (< 90)
            "post_volume": 2000     # Layer 1 Trigger (> 1000)
        })
    
    # Add Human
    comments.append({
        "id": generate_id(),
        "author": "real_human_dave",
        "text": human_comment,
        "account_age_days": 365,
        "post_volume": 50
    })

    print(f"Sending {len(comments)} comments to {API_URL}...")
    
    try:
        response = requests.post(API_URL, json={"comments": comments})
        response.raise_for_status()
        results = response.json()
        
        print("\n--- RESULTS ---")
        for res in results:
            print(f"User: {res['comment_id']} | Score: {res['bot_score']}% | Risk: {res['risk_level']}")
            print(f"   Breakdown: {res['breakdown']}")
            print("-" * 30)
            
        # Assertions for Validation
        bots = [r for r in results if r['bot_score'] >= 70]
        humans = [r for r in results if r['bot_score'] < 40]
        
        print("\n--- VERIFICATION ---")
        if len(bots) >= 4:
            print("SUCCESS: Detected the swarm coordination.")
        else:
            print("FAILURE: Swarm missed.")
            
        if len(humans) == 1:
            print("SUCCESS: Human identified correctly.")
        else:
            print("FAILURE: Human false positive.")

    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to backend. Is 'main.py' running?")

if __name__ == "__main__":
    run_test()
