module "gcp" {
  source          = "./gcp"
  project_id      = var.gcp_project_id
  region          = var.gcp_region
  db_password     = var.db_password
  openai_api_key  = var.openai_api_key
}

module "aws" {
  source          = "./aws"
  aws_region      = var.aws_region
  db_password     = var.db_password
  openai_api_key  = var.openai_api_key
}
