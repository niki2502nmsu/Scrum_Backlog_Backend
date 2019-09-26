/**
 * sprint.js
 * -------------------------------------------------------------------------
 * UID        | Primary Key
 * -------------------------------------------------------------------------
 * description| description of this sprint
 * startDate  | creation time stamp
 * endDate    | update time stamp
 * -------------------------------------------------------------------------
 * projectUID | foreign key to users table=
 */
module.exports = (sequelize, DataTypes) => {
  // -----------------------------------------------------------------------
  // Define
  // -----------------------------------------------------------------------
  const sprint = sequelize.define('sprint', {
    UID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    description: { type: DataTypes.STRING, allowNull: true },
    startDate: { type: DataTypes.DATE, allowNull: false },
    endDate: { type: DataTypes.DATE, allowNull: false },
    projectUID: {type: DataTypes.INTEGER, allowNull: false}
  });

  // -----------------------------------------------------------------------
  // Associations
  // -----------------------------------------------------------------------
  sprint.associate = function (models) {
    models.sprint.belongsTo(models.project, {
      onDelete: 'no action',
      foreignKey: 'projectUID',
    });

    models.sprint.hasMany(models.assignment, {
      onDelete: 'cascade',
      foreignKey: 'sprintUID',
    });
  };

  return sprint;
};
