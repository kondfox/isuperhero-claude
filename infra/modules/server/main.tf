terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
  }
}

# SSH key (must already exist in Hetzner Cloud Console)
data "hcloud_ssh_key" "default" {
  name = var.ssh_key_name
}

# Firewall
resource "hcloud_firewall" "server" {
  name = "${var.env}-isuperhero-fw"

  # HTTP
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # HTTPS
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # Colyseus WebSocket game server
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "2567"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  # SSH (restrict to your IP in production)
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = var.ssh_allowed_ips
  }
}

# Persistent volume for PostgreSQL data
resource "hcloud_volume" "postgres" {
  name      = "${var.env}-isuperhero-pg"
  size      = var.volume_size_gb
  location  = var.location
  format    = "ext4"
}

# VPS server
resource "hcloud_server" "app" {
  name        = "${var.env}-isuperhero"
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location

  ssh_keys = [data.hcloud_ssh_key.default.id]

  firewall_ids = [hcloud_firewall.server.id]

  labels = {
    env     = var.env
    project = "isuperhero"
  }

  user_data = templatefile("${path.module}/cloud-init.yaml.tpl", {
    env = var.env
  })
}

# Attach volume to server
resource "hcloud_volume_attachment" "postgres" {
  volume_id = hcloud_volume.postgres.id
  server_id = hcloud_server.app.id
  automount = true
}
