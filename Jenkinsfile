pipeline {

    agent any

    environment {
        DOCKERHUB_USER = 'kaushal2608'

        FRONTEND_IMAGE = 'kaushal2608/blogging-platform:frontend'
        BACKEND_IMAGE  = 'kaushal2608/blogging-platform:backend'

        APP_SERVER = '10.0.1.91'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('Build Docker Images') {
            steps {

                sh '''
                    echo "Building frontend image..."
                    docker build -t $FRONTEND_IMAGE ./frontend

                    echo "Building backend image..."
                    docker build -t $BACKEND_IMAGE ./backend
                '''
            }
        }

        stage('Push Images to Docker Hub') {
            steps {

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {

                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login \
                            -u "$DOCKER_USER" \
                            --password-stdin

                        echo "Pushing frontend image..."
                        docker push $FRONTEND_IMAGE

                        echo "Pushing backend image..."
                        docker push $BACKEND_IMAGE

                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to Application Server') {
            steps {

                sh '''
                    echo "Connecting to Application Server..."

                    ssh -i /var/lib/jenkins/.ssh/prt.pem \
                        -o StrictHostKeyChecking=no \
                        ubuntu@$APP_SERVER "
                        
                        echo 'Pulling latest frontend image...'
                        sudo docker pull $FRONTEND_IMAGE

                        echo 'Pulling latest backend image...'
                        sudo docker pull $BACKEND_IMAGE

                        echo 'Stopping old containers...'
                        sudo docker rm -f blogging-frontend 2>/dev/null || true
                        sudo docker rm -f blogging-backend 2>/dev/null || true

                        echo 'Creating Docker network...'
                        sudo docker network create blogging-network 2>/dev/null || true

                        echo 'Starting backend...'
                        sudo docker run -d \
                            --name blogging-backend \
                            --network blogging-network \
                            -e DB_HOST=10.0.2.208 \
                            -e DB_USER=bloguser \
                            -e DB_PASSWORD=blogpassword \
                            -e DB_NAME=blogdb \
                            $BACKEND_IMAGE

                        echo 'Starting frontend...'
                        sudo docker run -d \
                            --name blogging-frontend \
                            --network blogging-network \
                            -p 80:80 \
                            $FRONTEND_IMAGE

                        echo 'Deployment completed.'

                        sudo docker ps
                    "
                '''
            }
        }

        stage('Verify Application') {
            steps {

                sh '''
                    echo "Checking application..."

                    ssh -i /var/lib/jenkins/.ssh/prt.pem \
                        -o StrictHostKeyChecking=no \
                        ubuntu@$APP_SERVER \
                        "curl -f http://localhost && echo 'APPLICATION IS WORKING'"
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
            echo 'CHECK CONSOLE OUTPUT'
            echo '======================================'
        }
    }
}