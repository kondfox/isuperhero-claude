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
  - mkdir -p /data
  # Create stable symlink to Hetzner volume (automounted at /mnt/HC_Volume_*)
  - |
    VOLUME_MOUNT=$(ls -d /mnt/HC_Volume_* 2>/dev/null | head -1)
    if [ -n "$VOLUME_MOUNT" ]; then
      ln -sfn "$VOLUME_MOUNT" /data/postgres
    fi
