#!/bin/bash
# Test staff login API

echo "Testing INS1731 login..."
curl -s -X POST http://localhost:5001/api/mobile/auth/staff-login \
  -H "Content-Type: application/json" \
  -d '{"username":"INS1731","password":"test123"}'
echo ""
echo ""

echo "Testing COL3126 login..."
curl -s -X POST http://localhost:5001/api/mobile/auth/staff-login \
  -H "Content-Type: application/json" \
  -d '{"username":"COL3126","password":"test123"}'
echo ""
