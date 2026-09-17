output "bastion_public_ip" {
  description = "Bastion / Jenkins Public IP"
  value       = aws_instance.bastion.public_ip
}

output "application_public_ip" {
  description = "Application Public IP (for Web access)"
  value       = aws_instance.application.public_ip
}

output "application_private_ip" {
  description = "Application Private IP (for Ansible & Jenkins SSH Node)"
  value       = aws_instance.application.private_ip
}

output "database_private_ip" {
  description = "Database Private IP (for Ansible & MySQL connection)"
  value       = aws_instance.database.private_ip
}

output "public_subnet_1_id" {
  description = "ID of Public Subnet 1"
  value       = aws_subnet.public_1.id
}

output "public_subnet_2_id" {
  description = "ID of Public Subnet 2"
  value       = aws_subnet.public_2.id
}

output "private_subnet_id" {
  description = "ID of Private Subnet"
  value       = aws_subnet.private.id
}