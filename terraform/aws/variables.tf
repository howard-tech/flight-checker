variable "aws_region" {
  description = "The AWS region"
  type        = string
  default     = "ap-southeast-1" # Singapore
}

variable "db_password" {
  description = "Password for the RDS database user"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API Key for the application"
  type        = string
  sensitive   = true
}
