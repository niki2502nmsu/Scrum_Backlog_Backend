/**
 * membership.js
 * -------------------------------------------------------------------------
 * UID        | Primary Key
 * -------------------------------------------------------------------------
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
  const membership = sequelize.define('membership', {
    UID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  });

  // -----------------------------------------------------------------------
  // Associations
  // -----------------------------------------------------------------------
  membership.associate = function (models) {
    models.membership.belongsTo(models.user, {
      onDelete: 'cascade',
      foreignKey: {name: 'userUID', allowNull: false},
    });

    models.membership.belongsTo(models.team, {
      onDelete: 'cascade',
      foreignKey: {name: 'teamUID', allowNull: false},
    });
  };

  return membership;
};
