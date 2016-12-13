node ('nxt'){
    stage "Checkout"
    checkout scm

    stage "Build"
    sh "sudo su buildout"
    sh "rm -rf node_modules"
    sh "rm -rf vendor"
    sh "npm install phantomjs-prebuilt"
    sh "npm install"
    sh "bower install"

    stage "JSLint"
    sh "grunt jshint"

    stage "Test"
    sh "grunt test"

    stage "Docs"
    sh "grunt docs"
}
