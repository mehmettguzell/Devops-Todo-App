#!/bin/bash
# EC2 User Data - Amazon Linux 2023
# Sadece bootstrap: instance ilk acilista sunucuyu Docker calistirmaya
# hazir hale getirir. Uygulamanin kendisini deploy etmez (bu CI/CD'nin isi).
set -euxo pipefail

# ---- Sistemi guncelle ----
dnf update -y

# ---- Docker kur ve baslat ----
dnf install -y docker git
systemctl enable docker
systemctl start docker

# ec2-user'i docker grubuna ekle (sudo'suz docker komutu icin)
usermod -aG docker ec2-user

# ---- Docker Compose plugin kur ----
DOCKER_CONFIG=/usr/local/lib/docker
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
