resource "google_artifact_registry_repository" "flight_repo" {
  location      = var.region
  repository_id = "flight-repo"
  description   = "Docker repository for Flight Checker"
  format        = "DOCKER"
}

resource "google_sql_database_instance" "instance" {
  name             = "flight-db-instance-tf" # Suffix to avoid collision with existing manual one if needed, or use same name if importing
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"
    ip_configuration {
      ipv4_enabled = true 
      # For production, strictly restrict authorized_networks or use Private IP
      authorized_networks {
        name  = "all"
        value = "0.0.0.0/0"
      }
    }
  }
  deletion_protection  = false # For demo/testing purposes
}

resource "google_sql_database" "database" {
  name     = "flight_db"
  instance = google_sql_database_instance.instance.name
}

resource "google_sql_user" "user" {
  name     = "flight_user"
  instance = google_sql_database_instance.instance.name
  password = var.db_password
}

# Cloud Run - API Service
resource "google_cloud_run_service" "api" {
  name     = "flight-checker-api-tf"
  location = var.region

  template {
    spec {
      containers {
        image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder until CI pushes real image
        env {
          name  = "DB_HOST"
          value = "/cloudsql/${google_sql_database_instance.instance.connection_name}"
        }
        env {
          name  = "DB_USER"
          value = google_sql_user.user.name
        }
        env {
          name  = "DB_PASSWORD"
          value = google_sql_user.user.password
        }
        env {
          name  = "DB_NAME"
          value = google_sql_database.database.name
        }
         env {
          name  = "OPENAI_API_KEY"
          value = var.openai_api_key
        }
      }
    }
    metadata {
      annotations = {
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.instance.connection_name
        "run.googleapis.com/client-name"        = "terraform"
      }
    }
  }

  autogenerate_revision_name = true

  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image, # Ignore image changes managed by CI/CD
    ]
  }
}

# Cloud Run - UI Service
resource "google_cloud_run_service" "ui" {
  name     = "flight-checker-ui-tf"
  location = var.region

  template {
    spec {
      containers {
        image = "us-docker.pkg.dev/cloudrun/container/hello" # Placeholder
        ports {
            container_port = 8080
        }
        env {
             name = "VITE_API_URL"
             value = google_cloud_run_service.api.status[0].url
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].spec[0].containers[0].image,
    ]
  }
}

# Public Access
data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "noauth_api" {
  location    = google_cloud_run_service.api.location
  project     = google_cloud_run_service.api.project
  service     = google_cloud_run_service.api.name
  policy_data = data.google_iam_policy.noauth.policy_data
}

resource "google_cloud_run_service_iam_policy" "noauth_ui" {
  location    = google_cloud_run_service.ui.location
  project     = google_cloud_run_service.ui.project
  service     = google_cloud_run_service.ui.name
  policy_data = data.google_iam_policy.noauth.policy_data
}
