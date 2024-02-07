module.exports = (MusicSource) => {

  let newMusicSource = { 
    id: MusicSource.id,
    isDeleted: MusicSource.isDeleted,
    name: MusicSource.name,
    source_url: MusicSource.source_url,
  };

  // remove undefined values
  if (newMusicSource.id){
    Object.keys(newMusicSource).forEach(key =>{
      if (newMusicSource[key] === undefined) return newMusicSource[key] = null;
    });
  } else {
    Object.keys(newMusicSource).forEach(key => newMusicSource[key] === undefined && delete newMusicSource[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newMusicSource) => {
   *   if (!newMusicSource.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newMusicSource) 
   */
  return Object.freeze(newMusicSource);
};
