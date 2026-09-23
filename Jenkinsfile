pipeline {
    agent any

    environment {
        PROJECT_NAME = "skillswap"
        BACKEND_IMAGE = "skillswap-backend"
        FRONTEND_IMAGE = "skillswap-frontend"
        IMAGE_TAG = "build-${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "=========================================="
                echo "Stage 1: Checkout Source Code from GitHub"
                echo "=========================================="
                checkout scmGit(
                    branches: [[name: '*/main'], [name: '*/prasad']],
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
                sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ./backend"
                sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ./frontend"
                echo "Docker images successfully built: ${BACKEND_IMAGE}:${IMAGE_TAG} and ${FRONTEND_IMAGE}:${IMAGE_TAG}"
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
            echo "Pipeline Succeeded! All stages passed (Checkout -> Build -> Test -> Docker Build)."
        }
        failure {
            echo "Pipeline Failed! Please check the stage console logs for errors."
        }
    }
}
