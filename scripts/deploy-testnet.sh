#!/usr/bin/env bash
# Cooler Cup — testnet deploy script
# Run this from your local machine (not inside Replit).
# Requirements: Sui CLI installed (https://docs.sui.io/guides/developer/getting-started/sui-install)

set -e

echo "=== Cooler Cup testnet deploy ==="

# 1. Switch to testnet
sui client switch --env testnet

# 2. Show active address
ADDR=$(sui client active-address)
echo "Active address: $ADDR"

# 3. Request faucet SUI (testnet only — free)
echo "Requesting testnet SUI from faucet..."
sui client faucet
sleep 5   # wait a few seconds for the coins to land

# 4. Check balance
echo "Balance:"
sui client balance

# 5. Publish the Move package
echo ""
echo "Publishing package..."
RESULT=$(sui client publish --gas-budget 100000000 --json)

echo ""
echo "=== Publish result ==="
echo "$RESULT" | python3 -c "
import json, sys
data = json.load(sys.stdin)
effects = data.get('effects', {})
created = effects.get('created', [])
print('Digest:', data.get('digest','?'))
for obj in created:
    ref = obj.get('reference', {})
    owner = obj.get('owner', {})
    oid = ref.get('objectId','?')
    # Package = immutable, AdminCap = addressed (owned by deployer)
    if 'Immutable' in str(owner):
        print('PACKAGE_ID =', oid)
    elif 'AddressOwner' in str(owner):
        print('ADMIN_CAP_ID =', oid)
"

echo ""
echo "=== Next steps ==="
echo "1. Copy PACKAGE_ID and ADMIN_CAP_ID from above into Replit Secrets."
echo "2. Set ADMIN_PRIVATE_KEY in Replit Secrets (your testnet wallet's private key)."
echo "   Export it with: sui keytool export --key-identity \$ADDR"
echo "3. Restart the API server workflow in Replit."
