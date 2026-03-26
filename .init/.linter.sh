#!/bin/bash
cd /home/kavia/workspace/code-generation/insurance-claim-risk-analyzer-4302/fraud_detection_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

