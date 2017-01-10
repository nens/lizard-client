node ('nxt'){
    stage "Checkout"
    checkout scm

    stage "Install"
    sh "sudo su buildout"
    sh "rm -rf node_modules"
    sh "rm -rf vendor"
    sh "npm install --optional=false"
    sh "bower install"

    stage "Test"
    sh "npm test"

    if (env.BRANCH_NAME == "master") {
      stage "Transifex"
      sh "npm transifex"
    }
}
