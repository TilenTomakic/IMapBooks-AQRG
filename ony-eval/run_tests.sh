#!/usr/bin/env bash
set -e
echo "STARTING PY TEST"
sleep 10
python ony-eval.py -v -t min.csv
