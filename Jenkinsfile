pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
  }
  environment {
    DOCKER_CLIENT_TIMEOUT = '300'
    // BuildKit triggers need for buildx on some Docker versions in CI
    // Disable to avoid 'buildx missing or broken' error on agents without the plugin
    DOCKER_BUILDKIT = '0'
// hello
  }
  stages {
    stage('Init Config') {
      steps {
        script {
          def b = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').replaceFirst(/^origin\//,'')
          // Map branch -> port and env credential ID
          def branchMap = [
            'longt2': [port: '8880', credId: 'ubnd_env_file_longt2'],
            'staging': [port: '8882', credId: 'ubnd_env_file_staging']
          ]
          if (branchMap.containsKey(b)) {
            env.DEPLOY = 'true'
            env.DEPLOY_BRANCH = b
            env.DEPLOY_PORT = branchMap[b].port
            env.CONTAINER_NAME = ("ubnd_api_" + b).replaceAll('[^A-Za-z0-9_]', '_')
            env.ENV_CRED_ID = branchMap[b].credId
          } else {
            env.DEPLOY = 'false'
          }
        }
      }
    }
    stage('Debug Info') {
      steps {
        sh 'echo BRANCH_NAME=$BRANCH_NAME && echo GIT_BRANCH=$GIT_BRANCH && hostname && docker --version && docker info >/dev/null || true'
      }
    }
    stage('Checkout') {
      when {
        expression { return env.DEPLOY == 'true' || env.CHANGE_ID }
      }
      steps {
        checkout scm
      }
    }
    stage('Prepare .env from Jenkins Secret') {
      when {
        expression { return env.DEPLOY == 'true' }
      }
      steps {
        script {
          // Create secret file credentials per branch in Jenkins:
          // - ID: 'ubnd_env_file_longt2'  -> .env for longt2
          // - ID: 'ubnd_env_file_staging' -> .env for staging
          if (!env.ENV_CRED_ID) {
            error 'ENV_CRED_ID is not set for this branch; check branchMap.'
          }
          withCredentials([file(credentialsId: env.ENV_CRED_ID, variable: 'ENV_FILE')]) {
            sh 'cp "$ENV_FILE" ./.env'
          }
        }
      }
    }
    stage('Build Image') {
      when {
        expression { return env.DEPLOY == 'true' || env.CHANGE_ID }
      }
      steps {
        retry(3) {
          sh '''
            set -e
            IMAGE_NAME=ubnd-api
            IMAGE_TAG=$(echo ${GIT_COMMIT:-latest} | cut -c1-7)
            echo "Pulling base image node:22-alpine (best-effort)"
            docker pull node:22-alpine || true
            echo "Building ${IMAGE_NAME}:${IMAGE_TAG}"
            docker build --pull -t ${IMAGE_NAME}:${IMAGE_TAG} .
            echo ${IMAGE_TAG} > .image_tag
          '''
        }
      }
    }
    stage('Migrate DB (Prisma)') {
      when {
        expression { return env.DEPLOY == 'true' }
      }
      steps {
        sh '''
          set -e
          IMAGE_NAME=ubnd-api
          IMAGE_TAG=$(cat .image_tag)
          BRANCH=$(echo ${BRANCH_NAME:-${GIT_BRANCH:-}} | sed 's#^origin/##')
          echo "Checking DB migration need for branch: ${BRANCH}"
          if [ "${BRANCH}" = "longt2" ]; then
            echo "Primary branch detected; running migrations."
            docker run --rm --env-file ./.env ${IMAGE_NAME}:${IMAGE_TAG} sh -lc 'npx prisma migrate deploy || npx prisma db push'
          else
            echo "Non-primary branch; applying schema idempotently (db push)."
            docker run --rm --env-file ./.env ${IMAGE_NAME}:${IMAGE_TAG} sh -lc 'npx prisma db push'
          fi
        '''
      }
    }
    stage('Deploy') {
      when {
        expression { return env.DEPLOY == 'true' }
      }
      steps {
        sh '''
          set -e
          IMAGE_NAME=ubnd-api
          IMAGE_TAG=$(cat .image_tag)
          CONTAINER_NAME=${CONTAINER_NAME}
          PORT=${DEPLOY_PORT}
          # Stop/remove old container if exists
          docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
          # Run new container
          docker run -d -v /var/www/public:/app/src/public \
            --name ${CONTAINER_NAME} \
            --restart unless-stopped \
            --env-file ./.env \
            -e PORT=${PORT} \
            -p ${PORT}:${PORT} \
            ${IMAGE_NAME}:${IMAGE_TAG}
        '''
      }
    }
    stage('Cleanup Old Images') {
      when {
        expression { return env.DEPLOY == 'true' }
      }
      steps {
        sh '''
          set -e
          IMAGE_NAME=ubnd-api
          KEEP=3
          # Get unique image IDs for the repository, newest first
          IDS=$(docker images --format '{{.Repository}} {{.ID}}' | awk -v name="$IMAGE_NAME" '$1==name{print $2}' | awk '!seen[$0]++')
          COUNT=0
          DELETE_IDS=""
          for id in $IDS; do
            COUNT=$((COUNT+1))
            if [ $COUNT -gt $KEEP ]; then
              DELETE_IDS="$DELETE_IDS $id"
            fi
          done
          if [ -n "$DELETE_IDS" ]; then
            echo "Removing old images (keeping $KEEP): $DELETE_IDS"
            docker rmi -f $DELETE_IDS || true
          else
            echo "No old images to remove for $IMAGE_NAME"
          fi
          # Also remove dangling layers
          docker image prune -f || true
        '''
      }
    }
  }
  post {
    failure {
      echo 'Build failed. Check logs.'
    }
    success {
      echo 'Build completed. Deploy runs on branches: longt2, staging.'
    }
  }
}
