/**
 * assignment.js
 * -------------------------------------------------------------------------
 * UID        | Primary Key
 * -------------------------------------------------------------------------
 * logUID     | foreign key to users table
 * sprintUID  | foreign key to sprints table
 */
module.exports = (sequelize, DataTypes) => {
  // -----------------------------------------------------------------------
  // Define
  // -----------------------------------------------------------------------
  const assignment = sequelize.define('assignment', {
    //UID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    logUID: {type: DataTypes.INTEGER, primaryKey: true},
    sprintUID: {type: DataTypes.INTEGER, primaryKey: true},
    estimate: {type: DataTypes.INTEGER}
  });

  // -----------------------------------------------------------------------
  // Associations
  // -----------------------------------------------------------------------
  assignment.associate = function (models) {
    models.assignment.belongsTo(models.user, {
      onDelete: 'no action',
      foreignKey: 'assignTo',
    });

    models.assignment.belongsTo(models.log, {
      onDelete: 'cascade',
      foreignKey: 'logUID',
    });

    models.assignment.belongsTo(models.sprint, {
      onDelete: 'cascade',
      foreignKey: 'sprintUID',
    });
  };

  return assignment;
};
