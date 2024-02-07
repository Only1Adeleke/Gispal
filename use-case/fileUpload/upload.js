const formidable = require('formidable');
const validUrl = require('valid-url');

const response = require('../../utils/response');
const makeDirectory = require('../../utils/makeDirectory');

const { uploadFilesOnLocalServer } = require('../../services/fileUpload');

const upload = async (req,res) =>{
  let combinedOutput = {};
  let defaultDirectory = 'public/assets';
  let allowedFileTypes = [
    'png',
    'jpeg',
    'jpg',
    'gif',
    'pdf',
    'doc',
    'docx',
    'msword',
    'vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls',
    'xlsx',
    'vnd.ms-excel',
    'json',
    'x-msdos-program',
    'x-msdownload',
    'exe',
    'x-ms-dos-executable'
  ];
  let maxFileSize = 5; //In Megabyte

  // Create Directory if not exist.
  await makeDirectory(defaultDirectory);
          
  // Setting up formidable options.
  const options = {
    multiples : true,
    maxFileSize : 300 * 1024 * 1024, //300 MB
    maxFieldsSize : 100 * 1024 * 1024, //50 MB
  };
  const form = new formidable.IncomingForm(options);

  //Parse Form data
  const {
    fields, files
  } = await new Promise(async (resolve, reject) => {
    form.parse(req, function (err, fields, files) {
      if (err) reject(err);
      resolve({
        fields,
        files
      });
    });
  });
          
  let uploadSuccess = [];
  let uploadFailed = [];
  let fileCount = 1;

  let fileArr = [];
  if (!files['files'] || files['files'].size == 0) {
    return response.badRequest({ message : 'Select at least one file to upload.' });
  }
  if (!Array.isArray(files['files'])) {
    fileArr.push(files['files']);
    files['files'] = fileArr;
  }

  for (let file of files['files']) {
    let response = await uploadFilesOnLocalServer(file, fields, fileCount++, allowedFileTypes, maxFileSize, defaultDirectory);
    if (response.status == false) {
      uploadFailed.push({
        'name': file.originalFilename,
        'error': response.message,
        'status': false
      });
    } else {
      let url = response.data;
      if (!validUrl.isUri(response.data)) {
        response.data = response.data.replace('/public', '');
        url = `${response.data}`;
      }
      uploadSuccess.push({
        'name': file.originalFilename,
        'path': url,
        'status': true
      });
    }
  }

  let uploadFileRes = {
    uploadSuccess,
    uploadFailed
  };

  let fileUploadResponseObj = {};
  if (uploadFileRes.uploadSuccess.length > 0) {
    let message = `${uploadFileRes.uploadSuccess.length} File uploaded successfully out of ${uploadFileRes.uploadSuccess.length + uploadFileRes.uploadFailed.length}`;
    fileUploadResponseObj = {
      message: message,
      data: uploadFileRes
    };
  } else {
    let message = 'Failed to upload files.';
    fileUploadResponseObj = {
      message: message,
      data: uploadFileRes
    };
  }

  combinedOutput.uploadFileRes = fileUploadResponseObj;
  if (combinedOutput) {
    return response.success({ data: combinedOutput });
  }
          
};

module.exports = upload;