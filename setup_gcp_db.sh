#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Flight Checker Database Setup (Cloud SQL)..."

# 1. Verification
if ! command -v gcloud &> /dev/null; then echo "❌ gcloud CLI not found."; exit 1; fi
if ! command -v gh &> /dev/null; then echo "❌ gh CLI not found."; exit 1; fi

PROJECT_ID=$(gcloud config get-value project)
echo "📂 Target Project: $PROJECT_ID"

# 1.5 Refresh Auth if needed
if ! gcloud auth print-access-token &>/dev/null; then
    echo "⚠️  Token expired or not logged in. Opening login page..."
    gcloud auth login
fi

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project set. Please run './setup_gcp.sh' first."
    exit 1
fi

# 2. Configuration
INSTANCE_NAME="flight-db-instance"
DB_NAME="flight_db"
DB_USER="flight_user"
# Generate a random password
DB_PASSWORD=$(openssl rand -base64 16)
REGION="asia-southeast1" # Must match Run region usually for performance

# --- SERVICE ACCOUNT SETUP (Merged from setup_gcp.sh) ---
echo -e "\n🤖 Configuring Service Account..."
SA_NAME="github-deployer"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
    gcloud iam service-accounts create $SA_NAME --display-name="GitHub Actions Deployer"
    echo "   Service Account created."
else
    echo "   Service Account already exists."
fi

echo "   Assigning roles..."
# Add roles (quietly to avoid spam if already exists)
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/run.admin" --condition=None --quiet >/dev/null
# Add usage of Artifact Registry
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/artifactregistry.admin" --condition=None --quiet >/dev/null

echo "   Generating Key..."
KEY_FILE="gcp-sa-key.json"
rm -f $KEY_FILE
gcloud iam service-accounts keys create $KEY_FILE --iam-account=$SA_EMAIL --quiet

echo "   Setting GCP secrets..."
gh secret set GCP_PROJECT_ID --body "$PROJECT_ID"
gh secret set GCP_SA_KEY < $KEY_FILE
rm $KEY_FILE
# -----------------------------------------------------

echo -e "\n🔌 Enabling APIs..."
gcloud services enable sqladmin.googleapis.com artifactregistry.googleapis.com

echo -e "\n📦 Setting up Artifact Registry..."
AR_REPO="flight-repo"
if ! gcloud artifacts repositories describe $AR_REPO --location=$REGION &>/dev/null; then
    gcloud artifacts repositories create $AR_REPO --repository-format=docker --location=$REGION --description="Docker repository"
    echo "   Artifact Registry repo '$AR_REPO' created."
else
    echo "   Artifact Registry repo '$AR_REPO' already exists."
fi

# 3. Create Instance
echo -e "\n🐘 Creating Cloud SQL Instance '$INSTANCE_NAME' (this takes ~5-10 minutes)..."
echo "   (Using db-f1-micro for minimum configuration cost)"

if ! gcloud sql instances describe $INSTANCE_NAME &>/dev/null; then
    gcloud sql instances create $INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password=$DB_PASSWORD
else
    echo "   Instance already exists."
fi

# 4. Create Database
echo -e "\n🗄️  Creating Database '$DB_NAME'..."
if ! gcloud sql databases describe $DB_NAME --instance=$INSTANCE_NAME &>/dev/null; then
    gcloud sql databases create $DB_NAME --instance=$INSTANCE_NAME
else
    echo "   Database already exists."
fi

# 5. Create User
echo -e "\n👤 Creating User '$DB_USER'..."
if ! gcloud sql users describe $DB_USER --instance=$INSTANCE_NAME &>/dev/null; then
    gcloud sql users create $DB_USER \
        --instance=$INSTANCE_NAME \
        --password=$DB_PASSWORD
else
    echo "   User already exists. Updating password..."
    gcloud sql users set-password $DB_USER \
        --instance=$INSTANCE_NAME \
        --password=$DB_PASSWORD
fi

# 6. Get Connection Name
CONNECTION_NAME=$(gcloud sql instances describe $INSTANCE_NAME --format="value(connectionName)")
echo "🔗 Connection Name: $CONNECTION_NAME"

# 7. Configure GitHub Secrets
echo -e "\n🐙 Configuring GitHub Secrets..."

gh secret set GCP_SQL_INSTANCE_NAME --body "$CONNECTION_NAME"
gh secret set DB_HOST --body "/cloudsql/$CONNECTION_NAME"
# Note: DB_PORT for Unix socket is irrelevant but PG uses 5432 default
gh secret set DB_PORT --body "5432"
gh secret set DB_NAME --body "$DB_NAME"
gh secret set DB_USER --body "$DB_USER"
gh secret set DB_PASSWORD --body "$DB_PASSWORD"

echo -e "\n📝 Updating local .env file..."
# Backup existing .env
cp .env .env.bak
# Append new prod configs (commented out by default to avoid breaking local dev, or active if user prefers)
# User asked to "update .env locally", usually implies they want to use it.
# However, usually local dev matches docker-compose.
# I will add them as new PROD_ vars to avoid conflict, or overwrite if user wants.
# Given the request "update variable .env locally", I'll safely append them.

{
  echo ""
  echo "# Production Database Config (Auto-generated)"
  echo "PROD_DB_HOST=$CONNECTION_NAME" # For local proxy usage usually, or just reference
  echo "PROD_DB_USER=$DB_USER"
  echo "PROD_DB_PASSWORD=$DB_PASSWORD"
  echo "PROD_DB_NAME=$DB_NAME"
  echo "GCP_SQL_INSTANCE_NAME=$CONNECTION_NAME"
} >> .env

echo -e "\n✅ Database Setup Complete!"
echo "------------------------------------------------"
echo "Secrets configured on GitHub."
echo "Local .env updated with PROD_DB_ prefixes."
echo ""
echo "Deployment should now succeed!"
echo "------------------------------------------------"
