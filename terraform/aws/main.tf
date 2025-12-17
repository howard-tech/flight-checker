data "aws_availability_zones" "available" {}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "flight-checker-vpc"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "flight-private-subnet-${count.index}"
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "flight-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "Flight DB Subnet Group"
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "flight-rds-sg"
  description = "Allow inbound from App Runner"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"] # Allow from within VPC (App Runner connector)
  }
}

resource "aws_db_instance" "default" {
  allocated_storage      = 20
  db_name                = "flight_db"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t3.micro"
  username               = "flight_user"
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  publicly_accessible    = false
}

resource "aws_ecr_repository" "api" {
  name = "flight-checker-api"
  force_delete = true
}

resource "aws_ecr_repository" "ui" {
  name = "flight-checker-ui"
  force_delete = true
}

# IAM Role for App Runner to pull images
resource "aws_iam_role" "apprunner_access_role" {
  name = "AppRunnerECRAccessRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_access_policy" {
  role       = aws_iam_role.apprunner_access_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# VPC Connector
resource "aws_apprunner_vpc_connector" "connector" {
  vpc_connector_name = "flight-vpc-connector"
  subnets            = aws_subnet.private[*].id
  security_groups    = [aws_security_group.rds_sg.id] 
}

# App Runner - API
resource "aws_apprunner_service" "api" {
  service_name = "flight-checker-api"

  source_configuration {
    authentication_configuration {
        access_role_arn = aws_iam_role.apprunner_access_role.arn
    }
    image_repository {
      image_identifier      = "public.ecr.aws/aws-containers/hello-app-runner:latest" # Placeholder
      image_repository_type = "ECR_PUBLIC" # Use public placeholder initially to allow creation
      
      # For real ECR:
      # image_identifier      = "${aws_ecr_repository.api.repository_url}:latest"
      # image_repository_type = "ECR"
      
      image_configuration {
        port = "3001"
        runtime_environment_variables = {
            DB_HOST = aws_db_instance.default.address
            DB_PORT = "5432"
            DB_NAME = aws_db_instance.default.db_name
            DB_USER = aws_db_instance.default.username
            DB_PASSWORD = var.db_password
            OPENAI_API_KEY = var.openai_api_key
        }
      }
    }
  }

  network_configuration {
    egress_configuration {
      egress_type       = "VPC"
      vpc_connector_arn = aws_apprunner_vpc_connector.connector.arn
    }
  }

  depends_on = [aws_db_instance.default]
}

# App Runner - UI
resource "aws_apprunner_service" "ui" {
  service_name = "flight-checker-ui"

  source_configuration {
    authentication_configuration {
        access_role_arn = aws_iam_role.apprunner_access_role.arn
    }
    image_repository {
      image_identifier      = "public.ecr.aws/aws-containers/hello-app-runner:latest" # Placeholder
      image_repository_type = "ECR_PUBLIC" 
      
      image_configuration {
        port = "8080"
        runtime_environment_variables = {
             VITE_API_URL = "https://${aws_apprunner_service.api.service_url}"
        }
      }
    }
  }
}
