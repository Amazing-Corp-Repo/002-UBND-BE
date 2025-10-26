pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
  }
  environment {
    DOCKER_CLIENT_TIMEOUT = '300'
    DOCKER_BUILDKIT = '1'
  }
  stages {
    stage('Debug Info') {
      steps {
        sh 'echo BRANCH_NAME=$BRANCH_NAME && echo GIT_BRANCH=$GIT_BRANCH && hostname && docker --version && docker info >/dev/null || true'
      }
    }
    stage('Checkout') {
      when {
        expression {
          def b = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').replaceFirst(/^origin\//,'')
          return b == 'longt2' || env.CHANGE_ID
        }
      }
      steps {
        checkout scm
      }
    }
    stage('Prepare .env from Jenkins Secret') {
      when {
        expression {
          def b = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').replaceFirst(/^origin\//,'')
          return b == 'longt2'
        }
      }
      steps {
        script {
          // Create a secret file credential in Jenkins with ID: 'ubnd_env_file'
          // type: Secret file, content: full .env
          withCredentials([file(credentialsId: 'ubnd_env_file', variable: 'ENV_FILE')]) {
            sh 'cp "$ENV_FILE" ./.env'
          }
        }
      }
    }
    stage('Build Image') {
      when {
        expression {
          def b = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').replaceFirst(/^origin\//,'')
          return b == 'longt2' || env.CHANGE_ID
        }
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
        expression {
          def b = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').replaceFirst(/^origin\//,'')
          return b == 'longt2'
        }
      }
      steps {
        sh '''
          set -e
          IMAGE_NAME=ubnd-api
          IMAGE_TAG=$(cat .image_tag)
          echo "Running migrations with ${IMAGE_NAME}:${IMAGE_TAG}"
          docker run --rm --env-file ./.env ${IMAGE_NAME}:${IMAGE_TAG} sh -lc 'npx prisma migrate deploy || npx prisma db push'
        '''
      }
    }
    stage('Deploy') {
      when {
        expression {
          def b = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').replaceFirst(/^origin\//,'')
          return b == 'longt2'
        }
      }
      steps {
        sh '''
          set -e
          IMAGE_NAME=ubnd-api
          IMAGE_TAG=$(cat .image_tag)
          CONTAINER_NAME=ubnd_api
          # Stop/remove old container if exists
          docker rm -f ${CONTAINER_NAME} 2>/dev/null || true
          # Run new container
          docker run -d \
            --name ${CONTAINER_NAME} \
            --restart unless-stopped \
            --env-file ./.env \
            -p 8880:8880 \
            ${IMAGE_NAME}:${IMAGE_TAG}
        '''
      }
    }
    stage('Cleanup Old Images') {
      when {
        expression {
          def b = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').replaceFirst(/^origin\//,'')
          return b == 'longt2'
        }
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
      echo 'Build completed. Deploy runs only on branch longt2.'
    }
  }
}
