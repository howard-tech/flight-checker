output "api_url" {
  value = google_cloud_run_service.api.status[0].url
}

output "ui_url" {
  value = google_cloud_run_service.ui.status[0].url
}

output "db_instance_connection_name" {
    value = google_sql_database_instance.instance.connection_name
}
