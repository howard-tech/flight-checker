terraform {
  required_version = ">= 1.0"
  
  backend "gcs" {
    bucket  = "terraform-state-bucket"
    prefix  = "flight-checker/terraform"
  }
  
  # Alternative for AWS (commented):
  # backend "s3" {
  #   bucket         = "terraform-state-bucket"
  #   key            = "flight-checker/terraform"
  #   region         = "ap-southeast-1"
  #   dynamodb_table = "terraform-locks"
  # }
}
