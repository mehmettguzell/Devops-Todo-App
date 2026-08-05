#!/bin/bash
# EC2 User Data - Ubuntu 22.04/24.04
# Sadece bootstrap: instance ilk acilista sunucuyu Docker calistirmaya
# hazir hale getirir. Uygulamanin kendisini deploy etmez (bu CI/CD'nin isi).
set -euxo pipefail

# apt'nin config dosyasi / servis restart sorusu sormasini engelle. Bunlar
# olmadan `apt-get upgrade` user-data icinde (TTY yokken) kilitlenebiliyor ve
# instance "aciliyor" gibi gorunup dakikalarca takiliyor.
export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

APT_OPTS='-y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold'

# ---- Sistemi guncelle ----
apt-get update -y
# shellcheck disable=SC2086
apt-get upgrade $APT_OPTS

# ---- Docker'in resmi apt reposunu ekle ----
apt-get install -y ca-certificates curl gnupg git unzip
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# ---- Docker Engine + Compose plugin kur ----
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

# ubuntu kullanicisini docker grubuna ekle (sudo'suz docker komutu icin)
usermod -aG docker ubuntu

# ---- AWS CLI v2 ----
# Amazon Linux 2023'te AWS CLI hazir geliyordu, Ubuntu AMI'lerinde GELMIYOR.
# deploy.yml sunucuda `aws ssm get-parameter` calistirip .env'i Parameter
# Store'dan cekiyor; bu olmadan deploy "aws: command not found" ile patlar.
if ! command -v aws > /dev/null 2>&1; then
  arch=$(uname -m)  # x86_64 | aarch64 -> AWS CLI ikisini de ayni isimle yayinliyor
  curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-${arch}.zip" -o /tmp/awscliv2.zip
  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install
  rm -rf /tmp/aws /tmp/awscliv2.zip
fi
aws --version

# ---- SSM Agent ----
# Canonical Ubuntu AMI'lerinde snap olarak gelir ama her zaman etkin degil.
# Agent ayakta olmazsa GitHub Actions'taki send-command hedefi bulamaz ve
# deploy "InvalidInstanceId" ile duser.
snap install amazon-ssm-agent --classic || true
snap start amazon-ssm-agent || systemctl enable --now snap.amazon-ssm-agent.amazon-ssm-agent.service || true
