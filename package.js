Package.describe({
    name: 'seba:ufs-wabs',
    version: '0.1.0',
    author: 'seba.kerckhof@gmail.com',
    summary: 'Azure blob storage store for UploadFS',
    git: 'https://github.com/sebakerckhof/ufs-wabs',
    documentation: 'README.md',
    license: 'MIT'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');
    api.use('check');
    api.use('underscore');
    api.use('ecmascript');
    api.use('mongo');
    api.use('jalik:ufs@0.5.3');
    api.addFiles('ufs-wabs.js');
});

Npm.depends({
    'azure-storage': "0.10.0"
});


Package.onTest(function (api) {
    api.use('tinytest');
    api.use('seba:ufs-wabs');
    api.addFiles('ufs-wabs-tests.js');
});