pipeline {
    agent { label 'nxt' }
    stages {
        stage("Checkout") {
            steps {
                checkout scm
            }
        }
        stage("Install") {
            steps {
                sh "rm -rf node_modules"
                sh "rm -rf vendor"
                sh "npm install --optional=false"
                sh "bower install"
            }
        }
        stage("Test") {
            steps {
                sh "npm test"
            }
        }
        stage("Transifex") {
            when {
                expression {env.BRANCH_NAME == "master"}
            }
            steps {
                sh "npm install --optional=true"
                sh "npm run transifex"
            }
        }
    }
    post {
        always {
            sh "rm -rf node_modules"
            sh "rm -rf vendor"
        }
    }
}