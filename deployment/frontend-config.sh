#!/bin/bash

###############################################################################
# Frontend Configuration Script for EC2
# Bu script frontend config dosyasını production ayarlarıyla günceller
###############################################################################

set -e

echo "================================================"
echo "Frontend Configuration Tool"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Config dosyası yolu
CONFIG_FILE="/var/www/aishortfilm/frontend/js/config.js"

# Parametreleri al
if [ "$#" -lt 1 ]; then
    echo -e "${RED}Usage: $0 <api-url> [cloudfront-url] [s3-url]${NC}"
    echo ""
    echo "Examples:"
    echo "  $0 https://api.yoursite.com"
    echo "  $0 https://api.yoursite.com https://d1234567890.cloudfront.net"
    echo "  $0 http://12.34.56.78"
    exit 1
fi

API_URL="$1"
CDN_URL="${2:-}"
S3_URL="${3:-}"

echo -e "${YELLOW}Configuring frontend with:${NC}"
echo "  API URL: $API_URL"
echo "  CDN URL: ${CDN_URL:-Not set}"
echo "  S3 URL: ${S3_URL:-Not set}"
echo ""

# Backup mevcut config
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}Backing up existing config...${NC}"
    sudo cp "$CONFIG_FILE" "$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
fi

# API URL'yi güncelle
echo -e "${YELLOW}Updating API URL...${NC}"
if [ -w "$CONFIG_FILE" ]; then
    # Dosya yazılabilir
    sed -i "s|apiBaseUrl:.*|apiBaseUrl: '$API_URL',|" "$CONFIG_FILE"
else
    # Sudo gerekli
    sudo sed -i "s|apiBaseUrl:.*|apiBaseUrl: '$API_URL',|" "$CONFIG_FILE"
fi

# CDN URL'yi güncelle (eğer verilmişse)
if [ -n "$CDN_URL" ]; then
    echo -e "${YELLOW}Updating CDN URL...${NC}"
    if [ -w "$CONFIG_FILE" ]; then
        sed -i "s|cdnUrl:.*|cdnUrl: '$CDN_URL',|" "$CONFIG_FILE"
    else
        sudo sed -i "s|cdnUrl:.*|cdnUrl: '$CDN_URL',|" "$CONFIG_FILE"
    fi
fi

# S3 URL'yi güncelle (eğer verilmişse)
if [ -n "$S3_URL" ]; then
    echo -e "${YELLOW}Updating S3 URL...${NC}"
    if [ -w "$CONFIG_FILE" ]; then
        sed -i "s|s3Url:.*|s3Url: '$S3_URL',|" "$CONFIG_FILE"
    else
        sudo sed -i "s|s3Url:.*|s3Url: '$S3_URL',|" "$CONFIG_FILE"
    fi
fi

echo -e "${GREEN}✓ Frontend configuration updated successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Clear browser cache"
echo "  2. Test the application"
echo "  3. Monitor browser console for any errors"
echo ""
echo -e "${GREEN}Configuration complete!${NC}"

