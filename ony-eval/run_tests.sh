#!/usr/bin/env bash
set -e
echo "STARTING PY TEST"
python ony-eval.py -v -t main.csv
