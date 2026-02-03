#!/bin/bash
# SnapSpot Utilities Launcher
# Automatically detects Node.js or Python and starts local server

echo "====================================="
echo " SnapSpot Utilities Launcher"
echo "====================================="
echo ""

# Function to open browser based on OS
open_browser() {
    local url="$1"
    
    # Wait a moment for server to start
    sleep 2
    
    # Detect OS and open browser
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url" 2>/dev/null
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url" 2>/dev/null
        else
            echo "Please open your browser to: $url"
        fi
    else
        echo "Please open your browser to: $url"
    fi
}

# Check for Node.js
if command -v npx &> /dev/null; then
    echo "[OK] Node.js detected - starting http-server..."
    echo ""
    echo "Server starting on http://localhost:8081"
    echo "Browser will open automatically..."
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Open browser in background
    open_browser "http://localhost:8081" &
    
    # Start server
    npx http-server -p 8081 --cors
    exit 0
fi

# Check for Python
if command -v python3 &> /dev/null; then
    echo "[OK] Python 3 detected - starting HTTP server..."
    echo ""
    echo "Server starting on http://localhost:8081"
    echo "Browser will open automatically..."
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Open browser in background
    open_browser "http://localhost:8081" &
    
    # Start server
    python3 -m http.server 8081
    exit 0
fi

# Check for Python 2 (fallback)
if command -v python &> /dev/null; then
    echo "[OK] Python detected - starting HTTP server..."
    echo ""
    echo "Server starting on http://localhost:8081"
    echo "Browser will open automatically..."
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Open browser in background
    open_browser "http://localhost:8081" &
    
    # Start server
    python -m http.server 8081 2>/dev/null || python -m SimpleHTTPServer 8081
    exit 0
fi

# No server found
echo "[ERROR] No HTTP server found!"
echo ""
echo "SnapSpot Utilities requires either Node.js or Python to run."
echo "Please install one of the following:"
echo ""
echo "Node.js (Recommended):"
echo "  Download: https://nodejs.org/"
echo "  After installing, run this script again"
echo ""
echo "Python:"
echo "  macOS/Linux: Usually pre-installed"
echo "  Check with: python3 --version"
echo "  Download: https://www.python.org/downloads/"
echo ""
echo "After installing, make this script executable:"
echo "  chmod +x start.sh"
echo "  ./start.sh"
echo ""
read -p "Press Enter to exit..."
exit 1
