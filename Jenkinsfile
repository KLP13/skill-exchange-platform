pipeline {
    agent any

    // Poll GitHub about every 2 minutes so a push triggers the pipeline automatically
    triggers { pollSCM('H/2 * * * *') }

    environment {
        BACKEND_IMAGE = "skillswap-backend"
        FRONTEND_IMAGE = "skillswap-frontend"
        IMAGE_TAG = "build-${BUILD_NUMBER}"
        DOCKERHUB_USER = "klprasad"
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Automated Test') {
            steps {
                dir('backend') {
                    sh 'npm run typecheck'
                }
                echo 'Automated validation passed'
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG} ./backend"
                sh "docker build -t ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${IMAGE_TAG} ./frontend"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh 'echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin'
                sh "docker push ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG}"
                sh "docker push ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${IMAGE_TAG}"
            }
        }

        stage('Deploy') {
            steps {
                sh "docker pull ${DOCKERHUB_USER}/${BACKEND_IMAGE}:${IMAGE_TAG}"
                sh "docker pull ${DOCKERHUB_USER}/${FRONTEND_IMAGE}:${IMAGE_TAG}"
                sh 'docker compose -p skillswap down || true'
                sh 'docker rm -f skillswap-db skillswap-backend skillswap-frontend || true'
                sh 'docker compose -p skillswap up -d --no-build'
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                for i in $(seq 1 20); do
                  if curl -fs http://host.docker.internal:5173 > /dev/null; then
                    echo "Application is up"
                    exit 0
                  fi
                  sleep 5
                done
                echo "Application did not become reachable"
                exit 1
                '''
                echo "Deployed ${IMAGE_TAG}"
            }
        }
    }

    post {
        success { echo "CI/CD succeeded. Deployed ${IMAGE_TAG}" }
        failure { echo 'Pipeline failed. Deployment did not occur or could not be verified.' }
        always  { sh 'docker logout || true' }
    }
}