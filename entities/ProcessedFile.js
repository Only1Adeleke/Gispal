module.exports = (ProcessedFile) => {

  let newProcessedFile = { 
    id: ProcessedFile.id,
    isDeleted: ProcessedFile.isDeleted,
    user_id: ProcessedFile.user_id,
    file_name: ProcessedFile.file_name,
    file_type: ProcessedFile.file_type,
    file_size: ProcessedFile.file_size,
    processed_at: ProcessedFile.processed_at,
    status: ProcessedFile.status,
  };

  // remove undefined values
  if (newProcessedFile.id){
    Object.keys(newProcessedFile).forEach(key =>{
      if (newProcessedFile[key] === undefined) return newProcessedFile[key] = null;
    });
  } else {
    Object.keys(newProcessedFile).forEach(key => newProcessedFile[key] === undefined && delete newProcessedFile[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newProcessedFile) => {
   *   if (!newProcessedFile.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newProcessedFile) 
   */
  return Object.freeze(newProcessedFile);
};
