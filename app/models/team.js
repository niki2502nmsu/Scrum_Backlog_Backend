/**
 * team.js
 * -------------------------------------------------------------------------
 * UID        | Primary Key
 * -------------------------------------------------------------------------
 * name       | team name
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
  const team = sequelize.define('team', {
    UID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false, unique: true, validate: { len: [3, 50] }  },
    description: { type: DataTypes.STRING(150), allowNull: true },
  });

  // -----------------------------------------------------------------------
  // Associations
  // -----------------------------------------------------------------------
  team.associate = function (models) {
    models.team.belongsTo(models.user, {
      onDelete: 'no action',
      foreignKey: 'ownerUID',
    });

    models.team.hasMany(models.project, {
      onDelete: 'cascade',
      foreignKey: 'teamUID',
    });
  };

  return team;
};
