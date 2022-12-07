#!/bin/bash
FUNCTION_URL="https://uploadprofilepictures.azurewebsites.net/api/HttpTrigger1?code=IgF2r6e2XexC9NHfXrZ7tY1jCAmpfLipDMgD5Il7EmSM0WPRADgPCAvJGtxkPv7ZCu88LuQODPRH+AStFRptMQ=="

echo "${FUNCTION_URL}"

curl -X POST \
-F "filename=@cat.png" \
-H "Content-Type: text/plain" \
"$FUNCTION_URL&filename=cat.png" --verbose