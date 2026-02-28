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
  #   key    = "stage/terraform.tfstate"
  #   region = "eu-central-1"
  # }
}

provider "hcloud" {
  token = var.hcloud_token
}

module "server" {
  source = "../../modules/server"

  env            = "stage"
  server_type    = "cx23"
  location       = "nbg1"
  ssh_key_name   = var.ssh_key_name
  volume_size_gb = 20
}

output "stage_server_ip" {
  value = module.server.server_ip
}
