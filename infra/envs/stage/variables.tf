variable "hcloud_token" {
  description = "Hetzner Cloud API token for stage environment"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "Name of the SSH key registered in Hetzner Cloud Console"
  type        = string
}
