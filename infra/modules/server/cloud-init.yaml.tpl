#cloud-config
# Basic server setup for iSuperhero ${env} environment
package_update: true
package_upgrade: true

packages:
  - docker.io
  - docker-compose-v2
  - nginx
  - certbot
  - python3-certbot-nginx

runcmd:
  - systemctl enable docker
  - systemctl start docker
  - mkdir -p /opt/isuperhero
