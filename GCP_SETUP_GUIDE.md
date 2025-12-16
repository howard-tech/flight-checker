# Google Cloud Platform (GCP) Setup Guide for CI/CD

To authorize the Antigravity Agent (and GitHub Actions) to deploy your application, you need to set up a Service Account on GCP.

## Step 1: Create a GCP Project
1.  Go to the [GCP Console](https://console.cloud.google.com/).
2.  Create a new project (e.g., `flight-checker-deployment`).
3.  Note your **Project ID**.

## Step 2: Enable APIs
Enable the following APIs for your project:
*   **Cloud Run API**
*   **Container Registry API** (or Artifact Registry API)
*   **Cloud Build API**

## Step 3: Create a Service Account
1.  Go to **IAM & Admin > Service Accounts**.
2.  Click **Create Service Account**.
3.  Name it (e.g., `github-deployer`).
4.  Grants the following **Roles**:
    *   `Cloud Run Admin`
    *   `Storage Admin` (for Container Registry)
    *   `Service Account User`
5.  Click **Done**.

## Step 4: Generate Key
1.  Click on the newly created Service Account email.
2.  Go to the **Keys** tab.
3.  Click **Add Key > Create new key**.
4.  Select **JSON**.
5.  A file will download to your computer. **Keep this safe!**

## Step 5: Configure GitHub Secrets
1.  Go to your GitHub Repository > Settings > Secrets and variables > Actions.
2.  New Repository Secret: `GCP_PROJECT_ID` (Your Project ID).
3.  New Repository Secret: `GCP_SA_KEY` (Paste the entire content of the JSON file).

Once these are set, the "Antigravity Agent" (via GitHub Actions) will have permission to deploy!
