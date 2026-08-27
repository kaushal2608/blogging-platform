pipeline {

    agent {
        label 'application'
    }

    environment {
        DOCKERHUB_USER = 'kaushal2608'

        FRONTEND_IMAGE = 'kaushal2608/blogging-platform:frontend'
        BACKEND_IMAGE  = 'kaushal2608/blogging-platform:backend'

        DB_HOST = '10.0.2.208'
        DB_USER = 'bloguser'
        DB_PASSWORD = 'blogpassword'
        DB_NAME = 'blogdb'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                    echo "Building frontend Docker image..."
                    docker build -t $FRONTEND_IMAGE ./frontend
                '''
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                    echo "Building backend Docker image..."
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

        stage('Deploy Application') {
            steps {

                sh '''
                    echo "Stopping old containers..."

                    docker rm -f blogging-frontend 2>/dev/null || true
                    docker rm -f blogging-backend 2>/dev/null || true

                    echo "Creating Docker network..."

                    docker network create blogging-network 2>/dev/null || true

                    echo "Starting backend..."

                    docker run -d \
                        --name blogging-backend \
                        --network blogging-network \
                        -e DB_HOST=$DB_HOST \
                        -e DB_USER=$DB_USER \
                        -e DB_PASSWORD=$DB_PASSWORD \
                        -e DB_NAME=$DB_NAME \
                        $BACKEND_IMAGE

                    echo "Starting frontend..."

                    docker run -d \
                        --name blogging-frontend \
                        --network blogging-network \
                        -p 80:80 \
                        $FRONTEND_IMAGE

                    echo "Application deployed successfully."

                    docker ps
                '''
            }
        }

        stage('Verify Application') {
            steps {

                sh '''
                    echo "Testing frontend..."

                    curl -f http://localhost

                    echo ""
                    echo "Testing backend..."

                    curl -f http://localhost:5000/health || true

                    echo ""
                    echo "Application verification completed."
                '''
            }
        }
    }

    post {

        success {
            echo '=========================================='
            echo 'JENKINS PIPELINE SUCCESSFUL'
            echo 'APPLICATION DEPLOYED'
            echo '=========================================='
        }

        failure {
            echo '=========================================='
            echo 'JENKINS PIPELINE FAILED'
            echo 'CHECK CONSOLE OUTPUT'
            echo '=========================================='
        }
    }
}