pipeline {

    agent {
        label 'application'
    }

    environment {
        DOCKERHUB_USERNAME = 'kaushal2608'
        FRONTEND_IMAGE = 'kaushal2608/ecommerce-frontend:latest'
        BACKEND_IMAGE = 'kaushal2608/ecommerce-backend:latest'
        DOCKER_NETWORK = 'ecommerce-network'
        DB_HOST = '10.0.2.88'
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('Build Frontend Image') {
            steps {
                echo 'Building frontend Docker image...'

                sh '''
                    docker build \
                    -t ${FRONTEND_IMAGE} \
                    ./frontend
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                echo 'Building backend Docker image...'

                sh '''
                    docker build \
                    -t ${BACKEND_IMAGE} \
                    ./backend
                '''
            }
        }

        stage('Login to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login \
                        -u "$DOCKER_USERNAME" \
                        --password-stdin
                    '''
                }
            }
        }

        stage('Push Images to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub...'

                sh '''
                    docker push ${FRONTEND_IMAGE}
                    docker push ${BACKEND_IMAGE}
                '''
            }
        }

        stage('Create Docker Network') {
            steps {
                sh '''
                    docker network inspect ${DOCKER_NETWORK} >/dev/null 2>&1 || \
                    docker network create ${DOCKER_NETWORK}
                '''
            }
        }

        stage('Deploy Backend') {
            steps {
                echo 'Deploying ecommerce backend...'

                sh '''
                    docker rm -f ecommerce-backend || true

                    docker pull ${BACKEND_IMAGE}

                    docker run -d \
                        --name ecommerce-backend \
                        --network ${DOCKER_NETWORK} \
                        -p 5000:5000 \
                        -e DB_HOST=${DB_HOST} \
                        -e DB_USER=ecomuser \
                        -e DB_PASSWORD=ecompassword \
                        -e DB_NAME=ecomdb \
                        --restart unless-stopped \
                        ${BACKEND_IMAGE}
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                echo 'Deploying ecommerce frontend...'

                sh '''
                    docker rm -f ecommerce-frontend || true

                    docker pull ${FRONTEND_IMAGE}

                    docker run -d \
                        --name ecommerce-frontend \
                        --network ${DOCKER_NETWORK} \
                        -p 80:80 \
                        --restart unless-stopped \
                        ${FRONTEND_IMAGE}
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                echo 'Verifying containers...'

                sh '''
                    sleep 5

                    docker ps

                    echo "Testing frontend..."
                    curl -f http://localhost

                    echo "Testing backend..."
                    curl -f http://localhost:5000/health || true

                    echo "E-Commerce application deployment successful!"
                '''
            }
        }
    }

    post {

        success {
            echo '======================================'
            echo 'JENKINS PIPELINE SUCCESSFUL'
            echo 'E-COMMERCE APPLICATION DEPLOYED'
            echo '======================================'
        }

        failure {
            echo '======================================'
            echo 'JENKINS PIPELINE FAILED'
            echo 'CHECK THE BUILD LOG'
            echo '======================================'
        }
    }
}