pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
  }
  environment {
    COMPOSE_CMD = 'docker compose'
  }
  triggers {
    // Use your webhook (recommended) or enable polling as fallback
    // pollSCM('H/5 * * * *')
  }
  stages {
    stage('Checkout') {
      when { branch 'longt2' }
      steps {
        checkout scm
      }
    }
    stage('Prepare .env from Jenkins Secret') {
      when { branch 'longt2' }
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
    stage('Build') {
      when { branch 'longt2' }
      steps {
        sh "${COMPOSE_CMD} build"
      }
    }
    stage('Migrate DB (Prisma)') {
      when { branch 'longt2' }
      steps {
        // Run migrations if present; else push schema
        sh "${COMPOSE_CMD} run --rm app sh -lc 'npx prisma migrate deploy || npx prisma db push'"
      }
    }
    stage('Deploy Up') {
      when { branch 'longt' }
      steps {
        sh "${COMPOSE_CMD} up -d"
      }
    }
  }
  post {
    failure {
      echo 'Build failed. Check logs.'
    }
    success {
      echo 'Deployment successful on branch longt.'
    }
  }
}

