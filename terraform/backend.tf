terraform {
  required_version = ">= 1.0"

  backend "gcs" {
    bucket  = "flight-checker-tf-state" # REPLACE_ME with your actual bucket name
    prefix  = "terraform/state"
  }

  # Alternative for AWS (Uncomment if using S3):
  # backend "s3" {
  #   bucket         = "flight-checker-tf-state"
  #   key            = "terraform/state"
  #   region         = "ap-southeast-1"
  #   dynamodb_table = "terraform-locks"
  # }
}
