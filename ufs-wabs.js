if (Meteor.isServer) {
    var WABS = Npm.require('azure-storage');
}

/**
 * GridFS store
 * @param options
 * @constructor
 */
UploadFS.store.WABS = function (options) {
    // Set default options
    options = Object.assign({
        chunkSize: 1024 * 255,
        collectionName: 'uploadfs'
    }, options);

    // Check options
    if (!Match.test(options.chunkSize, Number)) {
        throw new TypeError('chunkSize is not a number');
    }

    if (!Match.test(options.collectionName, String)) {
        throw new TypeError('collectionName is not a string');
    }



    // Create the store
    var store = new UploadFS.Store(options);

    if (Meteor.isServer) {
             // Determine which folder (key prefix) in the bucket to use
          var folder = options.folder;
          if (typeof folder === "string" && folder.length) {
            if (folder.slice(0, 1) === "/") {
              folder = folder.slice(1);
            }
            if (folder.slice(-1) !== "/") {
              folder += "/";
            }
          } else {
            folder = "";
          }

          var container = options.container;

          if (!container){
            throw new Error('UploadFS.store.WABS you must specify the "container" option');
          }
            
          // Create WABS service
          var WABSBlobService = WABS.createBlobService(options.storageAccountOrConnectionString,options.storageAccessKey);

          //XXX: Is this necessary?
          WABSBlobService.createContainerIfNotExists(container,function(){});

        /**
         * Removes the file
         * @param fileId
         * @param callback
         */
        store.delete = function (fileId, callback) {
              WABSBlobService.deleteBlob(container, folder + fileId, function(error) {
                  if(callback){
                      callback(error, !error);
                  }
              });
        };

        /**
         * Returns the file read stream
         * @param fileId
         * @return {*}
         */
        store.getReadStream = function (fileId) {
            return WABSBlobService.createReadStream(container,folder + fileId);
        };

        /**
         * Returns the file write stream
         * @param fileId
         * @return {*}
         */
        store.getWriteStream = function (fileId, file) {
           var writeStream = WABSBlobService.createWriteStreamToBlockBlob(container, folder + fileId);

              // The filesystem does not emit the "end" event only close - so we
              // manually send the end event
              writeStream.on('close', function() {

                WABSBlobService.getBlobProperties(container, folder + fileId, function (error, properties) {
                  if (error) {
                    writeStream.emit('error', error);
                  } else {
                    var size;
                    if (options.rangeStart) {
                      var endOffset = properties.contentLength - 1;
                      var end = options.rangeEnd ? Math.min(options.rangeEnd, endOffset) : endOffset;
                      size = end - options.rangeStart + 1;
                    } else {
                      size = properties.contentLength;
                    }
                    // Emit end and return the fileId, size, and updated date
                    writeStream.emit('stored', {
                      fileId: fileId,
                      size: size,
                      storedAt: new Date()
                    });
                  }
                });
              });

              return writeStream;
        };
    }

    return store;
};