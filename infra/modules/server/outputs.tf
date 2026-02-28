output "server_ip" {
  description = "Public IPv4 address of the server"
  value       = hcloud_server.app.ipv4_address
}

output "server_id" {
  description = "Hetzner server ID"
  value       = hcloud_server.app.id
}

output "volume_id" {
  description = "PostgreSQL volume ID"
  value       = hcloud_volume.postgres.id
}
