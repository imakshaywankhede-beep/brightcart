pipeline {
    agent any

    environment {
        AWS_REGION         = 'eu-central-1'
        AWS_ACCOUNT_ID     = '340825716875'
        ECR_REGISTRY       = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        CLUSTER_NAME       = 'brightcart-cluster'
        IMAGE_TAG          = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Test') {
            parallel {
                stage('Test Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci --frozen-lockfile'
                            sh 'npm test -- --watchAll=false --passWithNoTests'
                        }
                    }
                }
                stage('Test API') {
                    steps {
                        dir('api') {
                            sh 'npm ci --frozen-lockfile'
                            sh 'npm test -- --passWithNoTests'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        sh "docker build -t ${ECR_REGISTRY}/brightcart/frontend:${IMAGE_TAG} ./frontend"
                        sh "docker tag ${ECR_REGISTRY}/brightcart/frontend:${IMAGE_TAG} ${ECR_REGISTRY}/brightcart/frontend:latest"
                    }
                }
                stage('Build API') {
                    steps {
                        sh "docker build -t ${ECR_REGISTRY}/brightcart/api:${IMAGE_TAG} ./api"
                        sh "docker tag ${ECR_REGISTRY}/brightcart/api:${IMAGE_TAG} ${ECR_REGISTRY}/brightcart/api:latest"
                    }
                }
                stage('Build Worker') {
                    steps {
                        sh "docker build -t ${ECR_REGISTRY}/brightcart/worker:${IMAGE_TAG} ./worker"
                        sh "docker tag ${ECR_REGISTRY}/brightcart/worker:${IMAGE_TAG} ${ECR_REGISTRY}/brightcart/worker:latest"
                    }
                }
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                        aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                        aws configure set region ${AWS_REGION}
                        aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                        docker push ${ECR_REGISTRY}/brightcart/frontend:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/brightcart/frontend:latest
                        docker push ${ECR_REGISTRY}/brightcart/api:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/brightcart/api:latest
                        docker push ${ECR_REGISTRY}/brightcart/worker:${IMAGE_TAG}
                        docker push ${ECR_REGISTRY}/brightcart/worker:latest
                    """
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id',     variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh """
                        aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                        aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                        aws configure set region ${AWS_REGION}
                        aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}

                        kubectl set image deployment/frontend frontend=${ECR_REGISTRY}/brightcart/frontend:${IMAGE_TAG} -n brightcart
                        kubectl set image deployment/api api=${ECR_REGISTRY}/brightcart/api:${IMAGE_TAG} -n brightcart
                        kubectl set image deployment/worker worker=${ECR_REGISTRY}/brightcart/worker:${IMAGE_TAG} -n brightcart

                        kubectl rollout status deployment/frontend -n brightcart
                        kubectl rollout status deployment/api -n brightcart
                        kubectl rollout status deployment/worker -n brightcart
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployment successful! Build ${BUILD_NUMBER} is live."
        }
        failure {
            echo "Pipeline failed. No deployment happened. Check logs above."
        }
    }
}
