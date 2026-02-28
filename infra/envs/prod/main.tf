terraform {
  required_version = ">= 1.9"

  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.49"
    }
  }

  # Remote state — configure backend bucket/credentials before `terraform init`
  # backend "s3" {
  #   bucket = "isuperhero-tfstate"
  #   key    = "prod/terraform.tfstate"
  #   region = "eu-central-1"
  # }
}

provider "hcloud" {
  token = var.hcloud_token
}

module "server" {
  source = "../../modules/server"

  env            = "prod"
  server_type    = var.server_type  # cx23 now, ccx13 when ready to launch
  location       = "nbg1"
  ssh_key_name   = var.ssh_key_name
  volume_size_gb = 20

  # Restrict SSH to known IPs in prod
  ssh_allowed_ips = var.ssh_allowed_ips
}

output "prod_server_ip" {
  value = module.server.server_ip
}
