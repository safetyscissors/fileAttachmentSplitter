var fs = require('fs');
var _ = require('underscore');
var SHOWTRACE = false
var path = process.argv[2];
var async = require('async');
var exec = require('child_process').exec;
var splitCount = Number(process.argv[3]) || 10;
var outputDir  = path+'fileAttachmentOutput';
var mainAction = (process.argv[4])?'cp':'mv';
var outputCurrent = 0;
var outputCurrentDir = '';

function server(){
  async.waterfall([

    //setup the output directory/clear stuff in it
    function(waterfallCallback){
      console.log('starting move');
      initOutput('./', function(initError){
        waterfallCallback(initError);
      });
    },

    //get and check the file path
    function(waterfallCallback){
      validatePath(path, function(validateError){
        waterfallCallback(validateError);
      });
    },

    //get the folders in the directory
    function(waterfallCallback){
      fs.readdir(path, function(readError, files){
        waterfallCallback(readError, files);
      })
    },    

    //for each folder, grab documents, move to output
    function(files, waterfallCallback){
      files = _.filter(files, function(fname){return (fname!='fileAttachmentOutput' && !fname.match(/^[\.,\_]/))});
      console.log('creating '+splitCount+' folders out of '+files.length+' files total');
      async.eachSeries(files,
        function eachIterator(file, eachCallback){
          makeNextFolder(files, files.indexOf(file), function(folderErr){
             //move to output           
             moveFile(file, eachCallback)
          });
        },
        function eachDone(eachErr){
          waterfallCallback(eachErr)
        }
      );
    },

    function(waterfallCallback){
      compressOutput(waterfallCallback);
    }

  ],
    function done(waterfallError){
      if(waterfallError) console.log(waterfallError);
      console.log('done');
    }            
  );
}
server();

function moveFile(file, callback){
  file = file.split(' ').join('\\ ');
  var moveDir = path+file;
  var command = mainAction+' -r '+moveDir+' '+outputCurrentDir;
  var child = exec(command, function(execErr, stdOut, stdErr){
    callback(execErr);
  });
}

function makeNextFolder(files, index, callback){
  var nextFolderNum = (outputCurrent)*Math.round(files.length/splitCount);
  if(index<nextFolderNum) return callback();

  if(index%100==0) console.log('moving doc:'+index);

  outputCurrent++;
  var folder = outputDir + '/output' + outputCurrent;
  outputCurrentDir = folder;
  fs.mkdir(folder, function(mkdirErr){
    console.log('creating folder:'+outputCurrent);
    return callback(mkdirErr);
  });
}

function compressOutput(callback){
  console.log('writing tars');
  fs.readdir(outputDir, function(readErr, files){
    files = _.filter(files, function(name){ return name.substr(0,6)=='output'});
    async.eachSeries(files, 
      function seriesIterator(file,seriesCallback){
        var pathedFile=outputDir+file;
        var child = exec("tar -zcvf "+outputDir+"/tars/"+file+".tar.gz "+outputDir+"/"+file, function(execErr, stdOut, stdErr){
          seriesCallback(execErr);
        });
      },

      function seriesDone(seriesErr){
        callback(seriesErr);
      }
    );
  });
}

function initOutput(outputPath, callback){
  if(!outputPath) outputPath = './';
  //clear the folder
  var child = exec('rm -r ' + outputDir, function(execErr, stdOut, stdErr){
    if(execErr) console.log(execErr); 

    fs.mkdir(outputDir,function(mkdirErr){
      if(mkdirErr) return callback(mkdirErr);

      fs.mkdir(outputDir+'/tars', function(mkdirErr3){
        if(mkdirErr3) return callback(mkdirErr3);

        makeNextFolder([],10, function(mkdirErr2){
          callback(mkdirErr2);
        })
      })
    })
  });
}

function validatePath(path, callback){
  if(!path) return callback(bad('path', 'there is no path:' + path));
  fs.lstat(path, function(statErr, fileResults){
    if(statErr) return callback(statErr);
    if(!fileResults) return callback(bad('path', 'couldnt open path:'+path));

    callback(null, path);
  });
}

function bad(who, why){
  var msg = (who + ' says ' + why);
  var errorObj = (new Error(msg))
  console.log('error:'+msg);

  if(SHOWTRACE){
    //console.log();
  }
  return errorObj;
}
