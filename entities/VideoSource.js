module.exports = (VideoSource) => {

  let newVideoSource = { 
    id: VideoSource.id,
    isDeleted: VideoSource.isDeleted,
    name: VideoSource.name,
    source_url: VideoSource.source_url,
  };

  // remove undefined values
  if (newVideoSource.id){
    Object.keys(newVideoSource).forEach(key =>{
      if (newVideoSource[key] === undefined) return newVideoSource[key] = null;
    });
  } else {
    Object.keys(newVideoSource).forEach(key => newVideoSource[key] === undefined && delete newVideoSource[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newVideoSource) => {
   *   if (!newVideoSource.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newVideoSource) 
   */
  return Object.freeze(newVideoSource);
};
