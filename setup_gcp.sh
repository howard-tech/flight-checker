#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Flight Checker CD Setup..."

# 1. Check Dependencies
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first."
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo "❌ gh CLI not found. Please install it first."
    exit 1
fi

# 2. Authentication Check
echo "🔍 Checking gcloud authentication..."
# We explicitly force login if we can't get a token, to fix the 'invalid_grant' issue
if ! gcloud auth print-access-token &>/dev/null; then
    echo "⚠️  You are not logged in or token expired. Opening login page..."
    gcloud auth login
fi

# 3. Project Setup
echo -e "\n📂 Project Configuration"
DEFAULT_ID="huuk-flight-checker"
echo "You requested to use project related to 'Huuk'."
echo "1) Create NEW project '$DEFAULT_ID'"
echo "2) Use EXISTING project (enter ID manually)"
read -p "Select validation option (1/2): " PROJECT_OPTION

if [ "$PROJECT_OPTION" == "1" ]; then
    PROJECT_ID=$DEFAULT_ID
    
    # List billing accounts
    echo "💰 Available Billing Accounts:"
    gcloud billing accounts list --format="value(name,displayName)"
    
    read -p "Enter Billing Account ID from above: " BILLING_ID
    
    echo "Creating project $PROJECT_ID..."
    gcloud projects create $PROJECT_ID --name="Flight Checker API"
    gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ID
    
    echo "✅ Project $PROJECT_ID created and linked to billing."
    
else
    read -p "Enter your Existing Project ID (e.g. huuk-123): " PROJECT_ID
fi

# Set current project
gcloud config set project $PROJECT_ID

# 4. Enable APIs
echo -e "\n🔌 Enabling required APIs (this may take a minute)..."
gcloud services enable \
    run.googleapis.com \
    containerregistry.googleapis.com \
    cloudbuild.googleapis.com \
    iamcredentials.googleapis.com

# 5. Service Account Setup
SA_NAME="github-deployer"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

echo -e "\n🤖 Creating Service Account: $SA_NAME..."
if ! gcloud iam service-accounts describe $SA_EMAIL &>/dev/null; then
    gcloud iam service-accounts create $SA_NAME --display-name="GitHub Actions Deployer"
else
    echo "Service account already exists."
fi

echo "Assigning roles..."
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/run.admin" --condition=None
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/storage.admin" --condition=None
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SA_EMAIL" --role="roles/iam.serviceAccountUser" --condition=None

# 6. Generate Keys
echo -e "\n🔑 Generating Service Account Key..."
KEY_FILE="gcp-sa-key.json"
# Remove old key if exists
rm -f $KEY_FILE
gcloud iam service-accounts keys create $KEY_FILE --iam-account=$SA_EMAIL

# 7. Configure GitHub Secrets
echo -e "\n🐙 Configuring GitHub Secrets..."
gh secret set GCP_PROJECT_ID --body "$PROJECT_ID"
gh secret set GCP_SA_KEY < $KEY_FILE

# Cleanup
rm $KEY_FILE

echo -e "\n✅ Setup Complete!"
echo "------------------------------------------------"
echo "The following secrets were set in your GitHub Repo:"
echo "- GCP_PROJECT_ID"
echo "- GCP_SA_KEY"
echo ""
echo "⚠️  REMINDER: You still need to manually add your Database secrets to GitHub:"
echo "- DB_HOST"
echo "- DB_PORT"
echo "- DB_NAME"
echo "- DB_USER"
echo "- DB_PASSWORD"
echo "------------------------------------------------"
