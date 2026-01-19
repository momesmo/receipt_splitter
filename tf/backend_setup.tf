# The S3 Bucket for State and Key storage
resource "aws_s3_bucket" "tf_state_bucket" {
  bucket = "receipt-splitter-tf-state" # Must be globally unique

  lifecycle {
    prevent_destroy = true # Protects your state from accidental deletion
  }
}

resource "aws_s3_bucket_versioning" "state_versioning" {
  bucket = aws_s3_bucket.tf_state_bucket.id
  versioning_configuration {
    status = "Enabled" # Allows you to roll back if the state gets corrupted
  }
}