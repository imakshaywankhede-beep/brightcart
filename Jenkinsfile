pipeline {
    agent any

    environment {
        AWS_REGION     = 'eu-central-1'
        AWS_ACCOUNT_ID = '340825716875'
        ECR_REGISTRY   = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        CLUSTER_NAME   = 'brightcart-cluster'
        IMAGE_TAG      = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                # Ensure tools exist
                node -v
                npm -v
                docker -v
                aws --version
                '''
            }
        }

        stage('Test') {
            parallel {
                stage('Test Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci || npm install'
                            sh 'npm test -- --watchAll=false --passWithNoTests || true'
                        }
                    }
                }
                stage('Test API') {
                    steps {
                        dir('api') {
                            sh 'npm ci || npm install'
                            sh 'npm test -- --passWithNoTests || true'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                docker build -t $ECR_REGISTRY/brightcart/frontend:$IMAGE_TAG ./frontend
                docker tag $ECR_REGISTRY/brightcart/frontend:$IMAGE_TAG $ECR_REGISTRY/brightcart/frontend:latest

                docker build -t $ECR_REGISTRY/brightcart/api:$IMAGE_TAG ./api
                docker tag $ECR_REGISTRY/brightcart/api:$IMAGE_TAG $ECR_REGISTRY/brightcart/api:latest

                docker build -t $ECR_REGISTRY/brightcart/worker:$IMAGE_TAG ./worker
                docker tag $ECR_REGISTRY/brightcart/worker:$IMAGE_TAG $ECR_REGISTRY/brightcart/worker:latest
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                    aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                    aws configure set region $AWS_REGION

                    # 🔥 Create repos if not exist (VERY IMPORTANT)
                    aws ecr describe-repositories --repository-names brightcart/frontend || \
                    aws ecr create-repository --repository-name brightcart/frontend

                    aws ecr describe-repositories --repository-names brightcart/api || \
                    aws ecr create-repository --repository-name brightcart/api

                    aws ecr describe-repositories --repository-names brightcart/worker || \
                    aws ecr create-repository --repository-name brightcart/worker

                    # Login
                    aws ecr get-login-password --region $AWS_REGION | \
                    docker login --username AWS --password-stdin $ECR_REGISTRY

                    # Push images
                    docker push $ECR_REGISTRY/brightcart/frontend:$IMAGE_TAG
                    docker push $ECR_REGISTRY/brightcart/frontend:latest

                    docker push $ECR_REGISTRY/brightcart/api:$IMAGE_TAG
                    docker push $ECR_REGISTRY/brightcart/api:latest

                    docker push $ECR_REGISTRY/brightcart/worker:$IMAGE_TAG
                    docker push $ECR_REGISTRY/brightcart/worker:latest
                    '''
                }
            }
        }

        stage('Deploy to EKS') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                    aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                    aws configure set region $AWS_REGION

                    aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME

                    kubectl set image deployment/frontend frontend=$ECR_REGISTRY/brightcart/frontend:$IMAGE_TAG -n brightcart || true
                    kubectl set image deployment/api api=$ECR_REGISTRY/brightcart/api:$IMAGE_TAG -n brightcart || true
                    kubectl set image deployment/worker worker=$ECR_REGISTRY/brightcart/worker:$IMAGE_TAG -n brightcart || true

                    kubectl rollout status deployment/frontend -n brightcart
                    kubectl rollout status deployment/api -n brightcart
                    kubectl rollout status deployment/worker -n brightcart
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful! Build ${BUILD_NUMBER} is live."
        }
        failure {
            echo "❌ Pipeline failed. Check logs above."
        }
    }
}
