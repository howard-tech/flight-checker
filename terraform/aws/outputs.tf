output "api_url" {
  value = "https://${aws_apprunner_service.api.service_url}"
}

output "ui_url" {
  value = "https://${aws_apprunner_service.ui.service_url}"
}

output "rds_endpoint" {
  value = aws_db_instance.default.endpoint
}
