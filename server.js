var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var log = require('npmlog');
var fs = require('fs');
var multer = require('multer');
require('dotenv').config({
  silent: true
});

var app = express();

var fileSchema = new Schema({
  name: String,
  size: Number,
  date: String
});

var File = mongoose.model('File', fileSchema);
var mongouri = process.env.MONGOLAB_URI || "mongodb://" + process.env.IP + ":27017/file-meta";
mongoose.connect(mongouri);

 // The format follows as, alias to use for real path, also allows permission to such path.

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  //app.route('/').get(function(req, res) {res.render('index');});
  app.get('/',function(req, res) {res.render('index');});

/// multer part
var storage = multer.diskStorage({
  destination: function(req, file, cb) {cb(null, 'uploads/');},
  filename: function(req, file, cb) {
    var getFileExt = function(fileName) {
      var fileExt = fileName.split(".");
      if (fileExt.length === 1 || (fileExt[0] === "" && fileExt.length === 2)) {return "";}
      return fileExt.pop();
    };
    cb(null, Date.now() + '.' + getFileExt(file.originalname));
  }
});
var multerUpload = multer({storage: storage});
var uploadFile = multerUpload.single('userFile');
  app.post('/upload', function(req, res) {
    uploadFile(req, res, function(err) {
      if (err) {log.error(err);}
      // Everything went fine 
      var fileDetails = {
        name: req.file.originalname,
        size: req.file.size,
        date: new Date().toLocaleString(),
        file: req.file.filename
      };
      // save file to db
      var file = new File(fileDetails);
      file.save(function(err, file) {
        if (err) {log.error(err);throw err;}
        log.info('Saved', file);
      });
      var filePath = "./uploads/" + req.file.filename; 
      fs.unlinkSync(filePath);
      res.send(fileDetails);
    });
  });



//server
  var port = process.env.PORT || 8080;
  app.listen(port, function() {log.info('Express', 'Listening on port %s', port)})