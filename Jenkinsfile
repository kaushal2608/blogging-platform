pipeline {

    agent {
        label 'blogging-application'
    }

    environment {
        DOCKERHUB_USERNAME = 'kaushal2608'
        FRONTEND_IMAGE = 'kaushal2608/blogging-platform:frontend'
        BACKEND_IMAGE = 'kaushal2608/blogging-platform:backend'
        APP_SERVER = '10.0.1.91'
        DOCKER_NETWORK = 'blogging-network'
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
                echo 'Deploying backend...'

                sh '''
                    docker rm -f blogging-backend || true

                    docker pull ${BACKEND_IMAGE}

                    docker run -d \
                        --name blogging-backend \
                        --network ${DOCKER_NETWORK} \
                        -p 5000:5000 \
                        -e DB_HOST=10.0.2.208 \
                        -e DB_USER=bloguser \
                        -e DB_PASSWORD=blogpassword \
                        -e DB_NAME=blogdb \
                        --restart unless-stopped \
                        ${BACKEND_IMAGE}
                '''
            }
        }

        stage('Deploy Frontend') {
            steps {
                echo 'Deploying frontend...'

                sh '''
                    docker rm -f blogging-frontend || true

                    docker pull ${FRONTEND_IMAGE}

                    docker run -d \
                        --name blogging-frontend \
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
                    curl -f http://localhost:5000 || true

                    echo "Application deployment successful!"
                '''
            }
        }
    }

    post {

        success {
            echo '======================================'
            echo 'JENKINS PIPELINE SUCCESSFUL'
            echo 'APPLICATION DEPLOYED'
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