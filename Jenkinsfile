node ('nxt'){
    stage "Checkout"
    checkout scm

    stage "Install"
    sh "sudo su buildout"
    sh "rm -rf node_modules"
    sh "rm -rf vendor"
    # Use optional false to install devDependencies to initialize Grunt and run
    # test, but not to build or run dev server.
    sh "npm install --optional=false"
    sh "bower install"

    stage "Test"
    sh "npm test"
}
