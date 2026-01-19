provider "aws" {
  region = "us-east-1" # Change to your preferred region
}

terraform {
  backend "s3" {
    bucket = "receipt-splitter-tf-state"
    key    = "receipt-splitter/terraform.tfstate"
    region = "us-east-1"
  }
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# --- 1. The EC2 Instance ---

# 1. Generate a secure private key
resource "tls_private_key" "ec2_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# 2. Register the Public Key with AWS
resource "aws_key_pair" "generated_key" {
  key_name   = "receipt-splitter-ec2-key"
  public_key = tls_private_key.ec2_key.public_key_openssh
}

# 3. Save the Private Key locally so you can SSH in
# This file will be created in your current directory
resource "local_file" "private_key_pem" {
  content         = tls_private_key.ec2_key.private_key_pem
  filename        = "${path.module}/ec2-key.pem"
  file_permission = "0600" # Necessary for SSH security
}

# 4. Store the Private Key in AWS Secrets Manager
resource "aws_secretsmanager_secret" "ec2_private_key" {
  name        = "receipt-splitter-ec2-private-key"
  description = "Private key for receipt-splitter EC2 SSH access"
}

resource "aws_secretsmanager_secret_version" "ec2_private_key_value" {
  secret_id     = aws_secretsmanager_secret.ec2_private_key.id
  secret_string = tls_private_key.ec2_key.private_key_pem
}

# Get the latest Amazon Linux 2023 AMI automatically
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

resource "aws_security_group" "receipt-splitter-sg" {
  name        = "receipt-splitter-sg"
  description = "Allow SSH access"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # specific IP is safer: ["YOUR_IP/32"]
  }

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "receipt-splitter-server" {
  ami           = data.aws_ami.amazon_linux_2023.id
  instance_type = "t3.micro" # Free tier eligible

  # Link to the key pair created above
  key_name           = aws_key_pair.generated_key.key_name
  iam_instance_profile = aws_iam_instance_profile.ec2_instance_profile.name

  vpc_security_group_ids = [aws_security_group.receipt-splitter-sg.id]

  tags = {
    Name = "ReceiptSplitter-Server"
  }

  # User Data to install dependencies, deploy assets, and start the web server
  user_data = <<-EOF
              #!/bin/bash
              yum update -y
              yum install python3 unzip awscli -y

              mkdir -p /opt/receipt-splitter
              aws s3 cp s3://${aws_s3_bucket.ec2_assets.bucket}/${aws_s3_object.ec2_assets_zip.key} /opt/receipt-splitter/ec2_assets.zip --region ${data.aws_region.current.id}
              unzip -o /opt/receipt-splitter/ec2_assets.zip -d /opt/receipt-splitter/site

              cat > /etc/systemd/system/receipt-splitter.service <<'SERVICE'
              [Unit]
              Description=Receipt Splitter static server
              After=network.target

              [Service]
              Type=simple
              WorkingDirectory=/opt/receipt-splitter/site
              ExecStart=/usr/bin/python3 -m http.server 8000
              Restart=always
              RestartSec=3

              [Install]
              WantedBy=multi-user.target
              SERVICE

              systemctl daemon-reload
              systemctl enable receipt-splitter.service
              systemctl start receipt-splitter.service
              EOF
}

resource "aws_iam_role" "ec2_role" {
  name = "receipt_splitter_ec2_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "ec2_assets_read_policy" {
  name = "receipt_splitter_ec2_assets_read"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject"]
      Resource = "${aws_s3_bucket.ec2_assets.arn}/${aws_s3_object.ec2_assets_zip.key}"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_assets_read_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_assets_read_policy.arn
}

resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "receipt_splitter_ec2_instance_profile"
  role = aws_iam_role.ec2_role.name
}

# --- 2. IAM Role for Lambda ---

resource "aws_iam_role" "lambda_role" {
  name = "receipt_splitter_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name = "receipt_splitter_lambda_policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:StartInstances",
          "ec2:StopInstances"
        ]
        Resource = "*" # Can strictly limit to aws_instance.discord_bot_server.arn
      },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

# --- 3. The Lambda Function ---

# Zip the python code automatically
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../app/lambda/main.py"
  output_path = "${path.module}/lambda_function.zip"
}

data "archive_file" "ec2_assets" {
  type        = "zip"
  source_dir  = "${path.module}/../app/ec2"
  output_path = "${path.module}/ec2_assets.zip"
}

resource "aws_s3_bucket" "ec2_assets" {
  bucket = "receipt-splitter-assets-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_object" "ec2_assets_zip" {
  bucket = aws_s3_bucket.ec2_assets.id
  key    = "ec2_assets.zip"
  source = data.archive_file.ec2_assets.output_path
  etag   = filemd5(data.archive_file.ec2_assets.output_path)
}

resource "aws_lambda_function" "ec2_controller" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "ReceiptSplitterManager"
  role          = aws_iam_role.lambda_role.arn
  handler       = "main.lambda_handler"
  runtime       = "python3.9"

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      INSTANCE_ID = aws_instance.receipt-splitter-server.id
      REGION      = "us-east-1"
    }
  }
}

# --- 4. EventBridge (CloudWatch) Rules ---

# Rule 1: Start Bot (e.g., 8 AM UTC)
resource "aws_cloudwatch_event_rule" "start_rule" {
  name                = "start-receipt-splitter"
  description         = "Starts the bot EC2 instance"
  schedule_expression = "cron(0 14 * * ? *)" # 9:00 AM EST
}

resource "aws_cloudwatch_event_target" "start_target" {
  rule      = aws_cloudwatch_event_rule.start_rule.name
  target_id = "lambda"
  arn       = aws_lambda_function.ec2_controller.arn
  input     = jsonencode({ "action" : "start" })
}

# Rule 2: Stop Bot (e.g., 10 PM UTC)
resource "aws_cloudwatch_event_rule" "stop_rule" {
  name                = "stop-receipt-splitter"
  description         = "Stops the bot EC2 instance"
  schedule_expression = "cron(0 23 * * ? *)" # 6:00 PM EST
}

resource "aws_cloudwatch_event_target" "stop_target" {
  rule      = aws_cloudwatch_event_rule.stop_rule.name
  target_id = "lambda"
  arn       = aws_lambda_function.ec2_controller.arn
  input     = jsonencode({ "action" : "stop" })
}

# Permission: Allow EventBridge to call Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ec2_controller.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.start_rule.arn
}

resource "aws_lambda_permission" "allow_eventbridge_stop" {
  statement_id  = "AllowExecutionFromEventBridgeStop"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ec2_controller.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.stop_rule.arn
}

# --- 5. Outputs ---
output "instance_ip" {
  value = aws_instance.receipt-splitter-server.public_ip
}