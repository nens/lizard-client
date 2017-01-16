node ('nxt'){
    stage "Checkout"
    checkout scm

    stage "Install"
    sh "rm -rf node_modules"
    sh "rm -rf vendor"
    sh "npm install --optional=false"
    sh "bower install"

    stage "Test"
    sh "npm test"

    if (env.BRANCH_NAME == "master") {
      stage "Install transifex tools"
      sh "npm install --optional=true"
      stage "Transifex"  
      sh "npm run transifex"
    }
}
