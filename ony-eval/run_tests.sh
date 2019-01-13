#!/usr/bin/env bash
set -e
echo "STARTING PY TEST"
sleep 60
echo "server is probably up, starting for real"
python ony-eval.py -v -t min.csv
