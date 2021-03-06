var fs = require('fs');
var logger = require('./logger');

module.exports = function RedisPackageStore(options) {
    var _packages = {};

    _init();
    function _init() {
        _loadPackages();
    }

    function _getPackage(packageName) {
        var item = _packages[packageName];

        if(!item) {
            return null;
        }

        item.name = packageName;
        item.hits = item.hits || 0;
        item.hits++;

        //could use yield
        setTimeout(_persistPackages, 10);

        return item;
    }

    function _registerPackages(register) {
            console.log(register);      
        for(var i = 0, len = register.length; i < len; i++) {
            var registerPackage = register[i];

            if(!registerPackage.name) {
                logger.log('Undefined package name');

                continue;
            }

           _packages[registerPackage.name] = {
                name: registerPackage.name,
                repo: registerPackage.repo,
                hits: 0
            };
            
           options.db.add(_packages[registerPackage.name]).then(function () {
             console.log("REGISTERED");
           }, function () {
              console.log("INVALID");
           });

            logger.log('Registered package: ' + registerPackage.name);
        }

        // _persistPackages();
    }

    function _removePackages(remove) {
        for(var i = 0, len = remove.length; i < len; i++) {
            options.db.remove(_packages[remove[i]]).then(function () {
              console.log("Removed Package");
              logger.log('Removed package: ' + remove[i]);              
            }, function () {
               console.log("INVALID");
            });
          
            delete _packages[remove[i]];
        }
    }

    function _persistPackages() {
        // if(options.db)
        // {
        //   
        // }
        // else{
        //   if(fs.existsSync(options.persistFilePath)) {
        //       fs.unlinkSync(options.persistFilePath);
        //   }
        // 
        //   fs.writeFileSync(options.persistFilePath, JSON.stringify(_packages, null, '    '));
        // }
    }

    function _loadPackages() {
        if(options.db)
        {
          options.db.find().then(function(packages){
            for(i in packages)
              _packages[i] = packages[i];
          })
        }
        else
        {
          if(!fs.existsSync(options.persistFilePath)) {
              return;
          }

          var json = fs.readFileSync(options.persistFilePath).toString();

          try {
              _packages = JSON.parse(json);
          }
          catch(e) {
              logger.error('Malformed registry file. It must be a valid json: ' + options.persistFilePath);

              throw e;
          }
        }
    }

    function _searchPackage(name) {
        var searchName = name.toLowerCase();
        var packages = [];

        for(var packageName in _packages) {
            if(_packages.hasOwnProperty(packageName) &&
                packageName.toLowerCase().indexOf(searchName) !== -1) {

                var item = _packages[packageName];
                packages.push({
                    name: item.name,
                    repo: item.repo
                });
            }
        }

        return packages;
    }

    return {
        packages: _packages,

        getPackage: _getPackage,
        registerPackages: _registerPackages,
        removePackages: _removePackages,

        searchPackage: _searchPackage,

        persistPackages: _persistPackages
    };
};