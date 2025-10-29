#!/bin/bash
BASE_URL="https://hng-stage2-country-api-5ea74a7cf687.herokuapp.com"

GREEN="\033[0;32m"
RED="\033[0;31m"
CYAN="\033[0;36m"
RESET="\033[0m"

test_endpoint() {
  local METHOD=$1
  local URL=$2
  local DESCRIPTION=$3
  local CURL_CMD="curl -s -X $METHOD $URL"

  echo -e "${CYAN}Testing: $DESCRIPTION ($METHOD $URL)${RESET}"
  RESPONSE=$($CURL_CMD)
  if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Success${RESET}"
  else
    echo -e "${RED}❌ Failed${RESET}"
  fi
  echo "$RESPONSE"
  echo -e "${CYAN}---------------------------------------${RESET}\n"
}

test_endpoint "GET" "$BASE_URL/" "Health Check"
test_endpoint "GET" "$BASE_URL/status" "Global Status"
test_endpoint "POST" "$BASE_URL/countries/refresh" "Refresh Data"
test_endpoint "GET" "$BASE_URL/countries" "Get All Countries"
test_endpoint "GET" "$BASE_URL/countries/Nigeria" "Get Country (Nigeria)"
test_endpoint "GET" "$BASE_URL/countries/status" "Countries Cache Status"
test_endpoint "GET" "$BASE_URL/countries/image" "Summary Image"
test_endpoint "DELETE" "$BASE_URL/countries/Nigeria" "Delete Country (Nigeria)"
