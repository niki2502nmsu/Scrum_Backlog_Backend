/**
 * status.js
 * -------------------------------------------------------------------------
 * UID        | Primary Key
 * -------------------------------------------------------------------------
 * name       | name of the status
 * description| short description
 * createdAt  | creation time stamp
 * updatedAt  | update time stamp
 * -------------------------------------------------------------------------
 */
module.exports = (sequelize, DataTypes) => {
  // -----------------------------------------------------------------------
  // Define
  // -----------------------------------------------------------------------
  const status = sequelize.define('status', {
    UID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.STRING(150), allowNull: false },
  });

  // -----------------------------------------------------------------------
  // Associations
  // -----------------------------------------------------------------------
  status.associate = function (models) {
    models.status.hasMany(models.log, {
      onDelete: 'no action',
      foreignKey: 'statusID',
    });
  };

  return status;
};
