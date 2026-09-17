pipeline {

    agent {
        label 'application'
    }

    environment {
        DOCKERHUB_USERNAME = 'kaushal2608'
        FRONTEND_IMAGE     = "${DOCKERHUB_USERNAME}/ecommerce-frontend:latest"
        BACKEND_IMAGE      = "${DOCKERHUB_USERNAME}/ecommerce-backend:latest"
        DOCKER_NETWORK     = 'ecommerce-network'
        DB_HOST            = '10.0.3.75'
        DB_USER            = 'ecomuser'
        DB_PASSWORD        = 'ecompassword'
        DB_NAME            = 'ecomdb'
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo '============================================='
                echo 'Stage 1: Checking out code from GitHub repository'
                echo '============================================='
                checkout scm
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                echo '============================================='
                echo 'Stage 2: Building Frontend Docker Image'
                echo "Image: ${FRONTEND_IMAGE}"
                echo '============================================='
                sh '''
                    docker build \
                        -t ${FRONTEND_IMAGE} \
                        ./frontend
                '''
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                echo '============================================='
                echo 'Stage 3: Building Backend Docker Image'
                echo "Image: ${BACKEND_IMAGE}"
                echo '============================================='
                sh '''
                    docker build \
                        -t ${BACKEND_IMAGE} \
                        ./backend
                '''
            }
        }

        stage('Login to Docker Hub') {
            steps {
                echo '============================================='
                echo 'Stage 4: Authenticating to Docker Hub'
                echo '============================================='
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login \
                            -u "$DOCKER_USER" \
                            --password-stdin
                    '''
                }
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                echo '============================================='
                echo 'Stage 5: Pushing Images to Docker Hub'
                echo '============================================='
                sh '''
                    docker push ${FRONTEND_IMAGE}
                    docker push ${BACKEND_IMAGE}
                '''
            }
        }

        stage('Configure Docker Network') {
            steps {
                echo '============================================='
                echo "Stage 6: Ensuring Custom Network '${DOCKER_NETWORK}' exists"
                echo '============================================='
                sh '''
                    docker network inspect ${DOCKER_NETWORK} >/dev/null 2>&1 || \
                    docker network create ${DOCKER_NETWORK}
                '''
            }
        }

        stage('Deploy Backend Container') {
            steps {
                echo '============================================='
                echo 'Stage 7: Deploying Node.js Backend Container'
                echo '============================================='
                sh '''
                    echo "Stopping and removing existing backend container if any..."
                    docker rm -f ecommerce-backend || true

                    echo "Pulling latest backend image..."
                    docker pull ${BACKEND_IMAGE}

                    echo "Starting ecommerce-backend container connected to ${DOCKER_NETWORK}..."
                    docker run -d \
                        --name ecommerce-backend \
                        --network ${DOCKER_NETWORK} \
                        -p 5000:5000 \
                        -e DB_HOST=${DB_HOST} \
                        -e DB_USER=${DB_USER} \
                        -e DB_PASSWORD=${DB_PASSWORD} \
                        -e DB_NAME=${DB_NAME} \
                        --restart unless-stopped \
                        ${BACKEND_IMAGE}
                '''
            }
        }

        stage('Deploy Frontend Container') {
            steps {
                echo '============================================='
                echo 'Stage 8: Deploying Nginx Frontend Container'
                echo '============================================='
                sh '''
                    echo "Stopping and removing existing frontend container if any..."
                    docker rm -f ecommerce-frontend || true

                    echo "Pulling latest frontend image..."
                    docker pull ${FRONTEND_IMAGE}

                    echo "Starting ecommerce-frontend container connected to ${DOCKER_NETWORK}..."
                    docker run -d \
                        --name ecommerce-frontend \
                        --network ${DOCKER_NETWORK} \
                        -p 80:80 \
                        --restart unless-stopped \
                        ${FRONTEND_IMAGE}
                '''
            }
        }

        stage('Verify Application Running') {
            steps {
                echo '============================================='
                echo 'Stage 9: Verifying Running Containers & Endpoints'
                echo '============================================='
                sh '''
                    echo "Waiting 5 seconds for containers to initialize..."
                    sleep 5

                    echo "Checking running Docker containers:"
                    docker ps --filter "name=ecommerce-"

                    echo "Testing Frontend HTTP response (port 80):"
                    curl -Is http://localhost:80 | head -n 5

                    echo "Testing Backend /health endpoint (port 5000):"
                    curl -s http://localhost:5000/health || true
                    echo ""

                    echo "Testing Frontend-to-Backend proxy (/api/health):"
                    curl -s http://localhost/api/health || true
                    echo ""
                '''
            }
        }
    }

    post {
        success {
            echo '====================================================='
            echo ' SUCCESS: 3-TIER E-COMMERCE APPLICATION DEPLOYED!    '
            echo '====================================================='
        }
        failure {
            echo '====================================================='
            echo ' FAILURE: PIPELINE FAILED. CHECK CONSOLE OUTPUT.     '
            echo '====================================================='
        }
    }
}