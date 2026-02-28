variable "hcloud_token" {
  description = "Hetzner Cloud API token for prod environment"
  type        = string
  sensitive   = true
}

variable "ssh_key_name" {
  description = "Name of the SSH key registered in Hetzner Cloud Console"
  type        = string
}

variable "server_type" {
  description = "Hetzner server type — cx23 during dev, upgrade to ccx13 at launch"
  type        = string
  default     = "cx23"
}

variable "ssh_allowed_ips" {
  description = "CIDR ranges allowed to SSH into prod server"
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"] # tighten this to your IP before going live
}
