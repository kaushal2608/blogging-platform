output "bastion_public_ip" {
  description = "Bastion / Jenkins Public IP"
  value       = aws_instance.bastion.public_ip
}

output "application_public_ip" {
  description = "Application Public IP"
  value       = aws_instance.application.public_ip
}

output "application_private_ip" {
  description = "Application Private IP"
  value       = aws_instance.application.private_ip
}

output "database_private_ip" {
  description = "Database Private IP"
  value       = aws_instance.database.private_ip
}