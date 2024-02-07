const fs = require('fs');
const path = require('path');
const makeDirectory = require('../../utils/makeDirectory');

/**
 * 
 * Function used to upload file in local storage.
 * 
 * @param   {object}    file
 * @param   {object}    fields
 * @param   {integer}   fileCount
 * @param   {array}     allowedFileTypes
 * @param   {integer}   maxFileSize
 * @param   {string}    defaultDirectory
 * @returns {object}    { status, message, data}
 * 
 */
async function uploadFilesOnLocalServer (file, fields, fileCount, allowedFileTypes, maxFileSize, defaultDirectory) {

  let tempPath = file.filepath;

  let extension = path.extname(file.originalFilename);
  extension = extension.split('.').pop();

  fileType = file.mimetype;

  if (allowedFileTypes.length == 0 || !allowedFileTypes.includes(extension)) {
    return {
      status: false,
      message: 'Filetype not allowed.'
    };
  }

  //Check File Size
  const fileSize = ((file.size / 1024) / 1024);
  if (maxFileSize < fileSize) {
    return {
      status: false,
      message: `Allow file size upto ${maxFileSize} MB.`
    };
  }

  //Create Directory if not exist.
  await makeDirectory(defaultDirectory);

  //Create New path
  let newPath = defaultDirectory + '/' + new Date().getTime() + path.extname(file.originalFilename);

  //Create requested directory,if given in request parameter.
  if (fields && fields.folderName) {
    let newDir = defaultDirectory + '/' + fields.folderName;

    await makeDirectory(newDir);

    if (fields.fileName) {
      newPath = newDir + '/' + fields.fileName + '-' + fileCount + path.extname(file.originalFilename);
      fileName = fields.fileName;
    }
  } else if (fields && fields.fileName) {
    newPath = defaultDirectory + '/' + fields.fileName + '-' + fileCount + path.extname(file.originalFilename);
    fileName = fields.fileName;
  }

  let data = fs.readFileSync(tempPath);
  fs.writeFileSync(newPath, data);
  fs.unlinkSync(tempPath);

  return {
    status: true,
    message: 'File upload successfully.',
    data: '/' + newPath
  };
}

module.exports = { uploadFilesOnLocalServer, };