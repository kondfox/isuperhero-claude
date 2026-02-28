variable "env" {
  description = "Environment name (stage | prod)"
  type        = string
}

variable "server_type" {
  description = "Hetzner server type (e.g. cx22, ccx13)"
  type        = string
  default     = "cx22"
}

variable "location" {
  description = "Hetzner datacenter location"
  type        = string
  default     = "nbg1"
}

variable "ssh_key_name" {
  description = "Name of the SSH key in Hetzner Cloud Console"
  type        = string
}

variable "ssh_allowed_ips" {
  description = "CIDR ranges allowed to SSH (restrict in prod)"
  type        = list(string)
  default     = ["0.0.0.0/0", "::/0"]
}

variable "volume_size_gb" {
  description = "Size of the PostgreSQL data volume in GB"
  type        = number
  default     = 20
}
