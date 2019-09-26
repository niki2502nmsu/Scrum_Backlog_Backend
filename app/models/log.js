/**
 * log.js
 * -------------------------------------------------------------------------
 * UID        | Primary Key
 * -------------------------------------------------------------------------
 * log        | contents
 * createdAt  | creation time stamp
 * updatedAt  | update time stamp
 * -------------------------------------------------------------------------
 * assignTo   | foreign key to users table
 * projectUID | foreign key to projects table
 * statusUID  | foreign key to statuses table
 * categoryUID| foreign key to categories table
 */
module.exports = (sequelize, DataTypes) => {
  // -----------------------------------------------------------------------
  // Define
  // -----------------------------------------------------------------------
  const log = sequelize.define('log', {
    UID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    log: { type: DataTypes.STRING, allowNull: false },
  });

  // -----------------------------------------------------------------------
  // Associations
  // -----------------------------------------------------------------------
  log.associate = function (models) {
    // models.log.belongsTo(models.user, {
    //   onDelete: 'no action',
    //   foreignKey: 'assignTo',
    // });

    models.log.belongsTo(models.project, {
      onDelete: 'no action',
      foreignKey: 'projectUID',
    });

    models.log.belongsTo(models.status, {
      onDelete: 'no action',
      foreignKey: 'statusID',
    });

    models.log.hasMany(models.assignment, {
      onDelete: 'cascade',
      foreignKey: 'logUID',
    });
  };

  return log;
};
