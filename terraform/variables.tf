variable "gcp_project_id" {
  description = "The GCP Project ID"
  type        = string
}

variable "gcp_region" {
  description = "The GCP region"
  type        = string
  default     = "asia-southeast1"
}

variable "aws_region" {
  description = "The AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "db_password" {
  description = "Password for database users (GCP & AWS)"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
}
