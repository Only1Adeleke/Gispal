const { DataTypes } = require('sequelize');
const sequelizePaginate = require('sequelize-paginate');

function makeModel (sequelize) {
  const socketData = sequelize.define('socketData', {
    socketId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    message: DataTypes.STRING,
  });
  sequelizePaginate.paginate(socketData);
  return socketData;
}

module.exports = makeModel;
