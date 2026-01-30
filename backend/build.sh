#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "--- Installing CPU-only PyTorch (Save Space/Time) ---"
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

echo "--- Installing Requirements ---"
pip install -r backend/requirements.txt
