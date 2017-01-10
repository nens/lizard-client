# Use npm install with optional false to install devDependencies to initialize
# Grunt and run test, but no dependencies to build or run dev server.

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
}
