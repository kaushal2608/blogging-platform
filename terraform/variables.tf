variable "aws_region" {
  description = "AWS Region to deploy infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "key_name" {
  description = "Existing AWS Key Pair name (without .pem extension)"
  type        = string
  default     = "prt2"
}

variable "instance_type" {
  description = "EC2 Instance type"
  type        = string
  default     = "t3.large"
}