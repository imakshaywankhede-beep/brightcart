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
                checkout scm
            }
        }

        }

        stage('Configure AWS') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                    aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                    aws configure set region ${AWS_REGION}
                    '''
                }
            }
        }

        stage('Create EKS Cluster (if not exists)') {
            steps {
                sh '''
                if ! aws eks describe-cluster --name ${CLUSTER_NAME} --region ${AWS_REGION} > /dev/null 2>&1; then
                    echo "Creating EKS Cluster..."
                    eksctl create cluster \
                      --name ${CLUSTER_NAME} \
                      --region ${AWS_REGION} \
                      --nodegroup-name brightcart-nodes \
                      --node-type t3.medium \
                      --nodes 2
                else
                    echo "Cluster already exists. Skipping creation."
                fi
                '''
            }
        }

        stage('Update kubeconfig') {
            steps {
                sh '''
                aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}
                kubectl get nodes
                '''
            }
        }

        stage('Create Namespace & Base Deployments') {
            steps {
                sh '''
                kubectl get namespace brightcart || kubectl create namespace brightcart
                kubectl apply -f k8s/
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                docker build -t ${ECR_REGISTRY}/brightcart/frontend:${IMAGE_TAG} ./frontend
                docker build -t ${ECR_REGISTRY}/brightcart/api:${IMAGE_TAG} ./api
                docker build -t ${ECR_REGISTRY}/brightcart/worker:${IMAGE_TAG} ./worker
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                sh '''
                aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

                docker push ${ECR_REGISTRY}/brightcart/frontend:${IMAGE_TAG}
                docker push ${ECR_REGISTRY}/brightcart/api:${IMAGE_TAG}
                docker push ${ECR_REGISTRY}/brightcart/worker:${IMAGE_TAG}
                '''
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh '''
                kubectl set image deployment/frontend frontend=${ECR_REGISTRY}/brightcart/frontend:${IMAGE_TAG} -n brightcart
                kubectl set image deployment/api api=${ECR_REGISTRY}/brightcart/api:${IMAGE_TAG} -n brightcart
                kubectl set image deployment/worker worker=${ECR_REGISTRY}/brightcart/worker:${IMAGE_TAG} -n brightcart

                kubectl rollout status deployment/frontend -n brightcart
                kubectl rollout status deployment/api -n brightcart
                kubectl rollout status deployment/worker -n brightcart
                '''
            }
        }

        stage('Get App URL') {
            steps {
                sh '''
                kubectl get svc -n brightcart
                '''
            }
        }
    }

    post {
        success {
            echo "🚀 FULL DEPLOYMENT SUCCESSFUL!"
        }
        failure {
            echo "❌ Pipeline failed!"
        }
    }
}
