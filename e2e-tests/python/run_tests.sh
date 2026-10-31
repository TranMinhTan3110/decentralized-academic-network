#!/usr/bin/env bash
# ==============================================================================
# E2E Test Runner for Linux / macOS / Git Bash
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "=== [E2E TEST RUNNER] DECENTRALIZED ACADEMIC NETWORK ==="

if [ -f "venv/bin/activate" ]; then
    echo "-> Kích hoạt venv..."
    source venv/bin/activate
fi

echo "-> Kiểm tra dependencies..."
pip install -r requirements.txt -q

echo "-> Thực thi test suite..."
pytest scenarios/ -v -s --html=report.html --self-contained-html "$@"

echo "=== Kiểm thử hoàn tất! Báo cáo: $DIR/report.html ==="
