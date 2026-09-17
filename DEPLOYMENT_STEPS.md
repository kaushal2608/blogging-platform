# 🛒 3-Tier E-Commerce DevOps Deployment Guide (Updated with Your IPs)

Ye document tumhare assignment ke exact requirements ke hisab se updated step-by-step guide hai with **your actual AWS Infrastructure IPs**.

---

## 🏗️ Your AWS Infrastructure Details

| Component | Subnet | IP Address | Role |
| :--- | :--- | :--- | :--- |
| **Bastion / Jenkins Server** | Public Subnet 1 (`10.0.1.0/24`) | Public: `65.2.189.251`<br>Private: `10.0.1.78` | Jenkins Master, Ansible Controller, SSH Jump |
| **Application Server** | Public Subnet 2 (`10.0.2.0/24`) | Public: `15.207.71.57`<br>Private: `10.0.2.62` | Jenkins Node, Docker, Node.js, Frontend & Backend Containers |
| **Database Server** | Private Subnet (`10.0.3.0/24`) | Private: `10.0.3.75` | MySQL 8.0 (`ecomdb`), Private to VPC |
| **NAT Gateway** | Public Subnet 1 (`10.0.1.0/24`) | Elastic IP | DB Server ke internet access ke liye (Apt updates) |
| **Internet Gateway** | VPC Level | Attached to VPC | Public subnets ko internet access deta hai |

---

## STEP 1: Git Push Updated Code

Apne local system / admin machine se updated code git me push kar do:

```bash
git add .
git commit -m "Update infra IPs for app and database"
git push origin project-2ecom
```

---

## STEP 2: Bastion Server me Connect & PEM File Setup

Apne local system ya admin instance se Bastion Server (`65.2.189.251`) me connect karo:

```bash
# Method A: Local machine se SCP karke prt2.pem Bastion me bhejo:
scp -i prt2.pem prt2.pem ubuntu@65.2.189.251:/home/ubuntu/

# Method B: Bastion me SSH karo:
ssh -i prt2.pem ubuntu@65.2.189.251

# Agar SCP nahi kiya to Bastion ke andar manually nano se paste kar do:
nano ~/prt2.pem
# (Content paste karo aur Ctrl+O, Enter, Ctrl+X)

# Key file permissions fix karo:
chmod 400 ~/prt2.pem
```

---

## STEP 3: Ansible Configuration on Bastion Server

Bastion Server (`65.2.189.251`) ke terminal me run karo:

```bash
# 1. Install Ansible
sudo apt update
sudo apt install -y ansible
ansible --version

# 2. Repo clone karo Bastion me (ya pull karo)
git clone -b project-2ecom https://github.com/kaushal2608/blogging-platform.git
cd ~/blogging-platform/ansible

# 3. Inventory file check karo (already updated with 10.0.2.62 and 10.0.3.75)
cat inventory
```

**Content should be:**
```ini
[app]
application ansible_host=10.0.2.62

[db]
database ansible_host=10.0.3.75

[all:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=/home/ubuntu/prt2.pem
ansible_python_interpreter=/usr/bin/python3
```

**Playbook Run & Verification:**
```bash
# 1. Ping test (dono green "pong" aane chahiye)
ansible all -i inventory -m ping

# 2. Playbook execute karo (App server pe Docker, Compose, Node.js, Git install hoga aur DB server pe MySQL)
ansible-playbook -i inventory playbook.yml

# 3. MySQL 3306 port listening check:
ansible db -i inventory -b -m shell -a "ss -lntp | grep 3306"

# 4. App server se DB server connection test:
ansible app -i inventory -b -m shell -a "timeout 5 bash -c '</dev/tcp/10.0.3.75/3306' && echo 'MySQL connection successful'"

# 5. App server tools check (Docker, Compose, Node.js, Git):
ansible app -i inventory -b -m shell -a "docker --version && docker compose version && node -v && git --version"

# 6. MySQL service active check:
ansible db -i inventory -b -m shell -a "systemctl is-active mysql"
```

---

## STEP 4: Jenkins Installation & Setup on Bastion Server

Bastion Server (`65.2.189.251`) par run karo:

```bash
# 1. Install Java 17 (Jenkins runtime)
sudo apt update
sudo apt install -y fontconfig openjdk-17-jre openjdk-17-jdk

# 2. Install Jenkins
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update
sudo apt-get install -y jenkins

# 3. Start & Enable Jenkins
sudo systemctl enable --now jenkins
sudo systemctl status jenkins --no-pager

# 4. Install Docker on Bastion (pipeline image build ke liye)
sudo apt install -y docker.io
sudo systemctl enable --now docker
sudo usermod -aG docker jenkins
sudo usermod -aG docker ubuntu
sudo systemctl restart jenkins

# 5. Jenkins user ko prt2.pem key permissions do:
sudo mkdir -p /var/lib/jenkins/.ssh
sudo cp /home/ubuntu/prt2.pem /var/lib/jenkins/.ssh/prt2.pem
sudo chown -R jenkins:jenkins /var/lib/jenkins/.ssh
sudo chmod 700 /var/lib/jenkins/.ssh
sudo chmod 400 /var/lib/jenkins/.ssh/prt2.pem

# 6. Test SSH from jenkins user to Application server (10.0.2.62):
sudo -u jenkins ssh -i /var/lib/jenkins/.ssh/prt2.pem -o StrictHostKeyChecking=no ubuntu@10.0.2.62 "hostname -I"

# 7. Jenkins Initial Admin Password nikalo:
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Ab browser me Jenkins open karo:
👉 **`http://65.2.189.251:8080`**
- Initial admin password enter karo.
- **Install suggested plugins** select karo.
- Create First Admin User details bharo.

---

## STEP 5: Docker Hub Credentials in Jenkins

1. Go to [hub.docker.com](https://hub.docker.com) -> Account Settings -> Security -> New Access Token -> Read, Write, Delete permissions copy karo.
2. In Jenkins:
   - **Manage Jenkins** → **Credentials** → **System** → **Global credentials (unrestricted)**
   - Click **Add Credentials**:
     - **Kind**: `Username with password`
     - **Username**: `YOUR_DOCKER_USERNAME` (e.g. `kaushal2608`)
     - **Password**: `YOUR_DOCKER_ACCESS_TOKEN`
     - **ID**: `dockerhub`   *(NOTE: ID exact 'dockerhub' hi rakhna)*
     - **Description**: `Docker Hub`
   - Click **Create**.

---

## STEP 6: Add Application Server as a Jenkins Node (Agent)

Requirement 7: Application Server (`10.0.2.62`) ko Jenkins Agent banana hai.

> **Pehle Application server pe Java install karo** (Agent ke liye zaroori hai).
> Bastion se ek command run karo:
> ```bash
> ansible app -i ~/blogging-platform/ansible/inventory -b -m apt -a "name=openjdk-17-jre state=present"
> ```

Jenkins UI me Node create karo:
1. **Manage Jenkins** → **Nodes** → **New Node**
2. **Node Name**: `application`
3. Select **Permanent Agent** → Click **Create**
4. Fill settings:
   - **Remote root directory**: `/home/ubuntu/jenkins-agent`
   - **Labels**: `application`   *(CRITICAL: Jenkinsfile me label 'application' hai)*
   - **Usage**: `Only build jobs with label expressions matching this node`
   - **Launch method**: `Launch agents via SSH`
     - **Host**: `10.0.2.62`
     - **Credentials** → Click **Add** → **Jenkins**:
       - **Kind**: `SSH Username with private key`
       - **ID**: `application-ssh`
       - **Username**: `ubuntu`
       - **Private Key**: Select `Enter directly` → Apni `prt2.pem` ka poora content paste karo.
       - Click **Add** and select this credential.
     - **Host Key Verification Strategy**: `Non verifying Verification Strategy`
5. Click **Save**.
6. Check node status: Click on `application` → Status should say **Agent is connected / online**.

---

## STEP 7: Create Jenkins Pipeline Job

1. Jenkins Dashboard → **New Item**
2. Name: `ecommerce-platform-pipeline`
3. Select **Pipeline** → Click **OK**
4. **Build Triggers**:
   - ☑ **GitHub hook trigger for GITScm polling**
5. **Pipeline Section**:
   - **Definition**: `Pipeline script from SCM`
   - **SCM**: `Git`
   - **Repository URL**: `https://github.com/kaushal2608/blogging-platform.git`
   - **Branch Specifier**: `*/project-2ecom` (ya jo branch tum use kar rahe ho)
   - **Script Path**: `Jenkinsfile`
6. Click **Save**.
7. Click **Build Now** to run the pipeline.

---

## STEP 8: GitHub Webhook Setup for Automated CI/CD

1. Open GitHub repo: `https://github.com/kaushal2608/blogging-platform`
2. **Settings** → **Webhooks** → **Add webhook**
3. **Payload URL**: `http://65.2.189.251:8080/github-webhook/` *(Trailing slash `/` zaroori hai)*
4. **Content type**: `application/json`
5. **Which events**: `Just the push event`
6. Click **Add webhook**.

---

## STEP 9: Final Application Verification

### 1. Browser me E-Commerce Platform Open karo:
👉 **`http://15.207.71.57`**

Aapko **CloudMart — 3-Tier E-Commerce Platform** UI live dikhega:
- **Presentation Tier**: Nginx frontend on port 80.
- **Application Tier**: Node.js API on port 5000 (`ecommerce-network`).
- **Database Tier**: MySQL 8.0 in Private Subnet (`10.0.3.75:3306`).
- **Features Verified**:
  - Click **"Test Connection"** -> Status banner turns green: `✅ All 3 Tiers Operational! (10.0.3.75 connected)`
  - Live product catalog loaded from MySQL `products` table.
  - Test **"Add Product to MySQL Store"** form to test live INSERT query.
  - Interactive **"Buy" / Cart** count test.

### 2. Application Server (`15.207.71.57`) par CLI Check:
```bash
# Containers check:
docker ps

# Network check:
docker network inspect ecommerce-network

# Backend health check:
curl http://localhost:5000/health

# Nginx reverse proxy health check:
curl http://localhost/api/health
```

---
🎯 **Done! Everything is set up and configured with your live AWS infrastructure.**
