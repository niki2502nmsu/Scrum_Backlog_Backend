/**
 * project.js
 * -------------------------------------------------------------------------
 * UID        | Primary Key
 * -------------------------------------------------------------------------
 * name       | project name
 * createdAt  | creation time stamp
 * updatedAt  | update time stamp
 * -------------------------------------------------------------------------
 * userUID    | foreign key to users table
 * teamUID    | foreign key to teams table
 */
module.exports = (sequelize, DataTypes) => {
  // -----------------------------------------------------------------------
  // Define
  // -----------------------------------------------------------------------
  const project = sequelize.define('project', {
    UID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true, validate: { len: [3, 50] } },
    description: { type: DataTypes.STRING(150), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  });

  // -----------------------------------------------------------------------
  // Associations
  // -----------------------------------------------------------------------
  project.associate = function (models) {
    // Has ---------------------------------
    models.project.hasMany(models.log, {
      onDelete: 'cascade',
      foreignKey: 'projectUID',
    });

    // models.project.hasMany(models.sprint, {
    //   onDelete: 'cascade',
    //   foreignKey: 'projectUID',
    // });

    // Belongs To --------------------------
    models.project.belongsTo(models.team, {
      onDelete: 'no action',
      foreignKey: {name: 'teamUID', allowNull: false},
    });

    models.project.belongsTo(models.user, {
      onDelete: 'no action',
      foreignKey: {name: 'ownerUID', allowNull: false},
    });
  };

  return project;
};
