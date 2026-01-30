import os
import sys
import plistlib
from pathlib import Path

def setup_autostart():
    # 1. Get current paths
    current_dir = Path(os.getcwd()).absolute()
    python_path = sys.executable
    backend_script = current_dir / "backend" / "main.py"
    
    # Label for the service
    label = "com.botdetector.backend"
    
    # 2. Define the Plist content
    plist_content = {
        "Label": label,
        "RunAtLoad": True,
        "KeepAlive": True,
        "WorkingDirectory": str(current_dir),
        "ProgramArguments": [
            python_path,
            str(backend_script)
        ],
        "StandardOutPath": f"/tmp/{label}.out.log",
        "StandardErrorPath": f"/tmp/{label}.err.log",
        "EnvironmentVariables": {
            "PORT": "8000"
        }
    }
    
    # 3. Determine destination
    home = Path.home()
    launch_agents_dir = home / "Library" / "LaunchAgents"
    launch_agents_dir.mkdir(parents=True, exist_ok=True)
    
    plist_path = launch_agents_dir / f"{label}.plist"
    
    # 4. Write the file
    print(f"Generating plist at: {plist_path}")
    with open(plist_path, 'wb') as f:
        plistlib.dump(plist_content, f)
        
    # 5. Load the service
    print("Unloading old service (if exists)...")
    os.system(f"launchctl unload {plist_path} 2>/dev/null")
    
    print("Loading new service...")
    os.system(f"launchctl load {plist_path}")
    
    print("\n✅ Success! The Bot Swarm Backend will now run automatically on login.")
    print(f"   Logs are available at: /tmp/{label}.out.log")
    print("   To stop it manually run: launchctl unload " + str(plist_path))

if __name__ == "__main__":
    # Ensure we are in the root directory
    if not os.path.exists("backend/main.py"):
        print("❌ Error: Please run this script from the project root folder.")
        print("   Usage: python backend/setup_mac_autostart.py")
    else:
        setup_autostart()
