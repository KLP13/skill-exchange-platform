pipeline {
    agent any

    environment {
        PROJECT_NAME = "skillswap"
        BACKEND_IMAGE = "skillswap-backend"
        FRONTEND_IMAGE = "skillswap-frontend"
        IMAGE_TAG = "build-${BUILD_NUMBER}"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
        DOCKERHUB_USER = "klprasad"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "=========================================="
                echo "Stage 1: Checkout Source Code from GitHub"
                echo "=========================================="
                checkout scmGit(
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/KLP13/skill-exchange-platform.git']]
                )
            }
        }

        stage('Build') {
            steps {
                echo "=========================================="
                echo "Stage 2: Building Backend"
                echo "=========================================="
                dir('backend') {
                    sh 'npm install --prefer-offline || npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Test / Validate') {
            steps {
                echo "=========================================="
                echo "Stage 3: Testing & Code Validation"
                echo "=========================================="
                dir('backend') {
                    sh 'npm run typecheck'
                }
                echo "Code validation passed successfully!"
            }
        }

        stage('Docker Build') {
            steps {
                echo "=========================================="
                echo "Stage 4: Building Docker Images"
                echo "=========================================="
                sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG} ./backend"
                sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${IMAGE_TAG} ./frontend"
                echo "Docker images successfully built: ${BACKEND_IMAGE}:${IMAGE_TAG} and ${FRONTEND_IMAGE}:${IMAGE_TAG}"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo "=========================================="
                echo "Stage 5: Pushing Images to Docker Hub"
                echo "=========================================="
                sh 'echo $DOCKERHUB_CREDENTIALS_PSW | docker login -u $DOCKERHUB_CREDENTIALS_USR --password-stdin'
                sh "docker push ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${IMAGE_TAG}"
                echo "Images pushed to Docker Hub successfully!"
            }
        }

        stage('Deploy') {
            steps {
                echo "=========================================="
                echo "Stage 6: Deploying Updated Application"
                echo "=========================================="
                sh 'docker compose down || true'
                sh 'docker compose up -d --build'
                echo "Deployment complete. Application is running."
            }
        }
    }

    post {
        always {
            echo "=========================================="
            echo "Pipeline Execution Finished"
            echo "=========================================="
        }
        success {
            echo "Pipeline Succeeded! Full CI/CD workflow completed: Checkout -> Build -> Test -> Docker Build -> Push -> Deploy."
            echo "Deployed image tag: ${IMAGE_TAG}"
        }
        failure {
            echo "Pipeline Failed! Deployment was NOT performed. Check the stage console logs for errors."
        }
    }
}
