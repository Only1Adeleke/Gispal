module.exports = (Announcement) => {

  let newAnnouncement = { 
    id: Announcement.id,
    isDeleted: Announcement.isDeleted,
    title: Announcement.title,
    content: Announcement.content,
    user_id: Announcement.user_id,
    created_at: Announcement.created_at,
  };

  // remove undefined values
  if (newAnnouncement.id){
    Object.keys(newAnnouncement).forEach(key =>{
      if (newAnnouncement[key] === undefined) return newAnnouncement[key] = null;
    });
  } else {
    Object.keys(newAnnouncement).forEach(key => newAnnouncement[key] === undefined && delete newAnnouncement[key]);
  }

  // To validate Entity uncomment this block

  /*
   * const validate = (newAnnouncement) => {
   *   if (!newAnnouncement.field) {
   *       throw new Error("this field is required");
   *   }
   * }
   * 
   * validate(newAnnouncement) 
   */
  return Object.freeze(newAnnouncement);
};
