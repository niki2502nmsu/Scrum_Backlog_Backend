/**
 * user.js
 * -------------------------------------------------------------------------
 * UID        | Primary Key
 * -------------------------------------------------------------------------
 * username   | username
 * email      | user login email
 * password   | hashed user password
 * firstName  | first name
 * lastName   | last name
 * createdAt  | creation time stamp
 * updatedAt  | update time stamp
 * -------------------------------------------------------------------------
 */
module.exports = (sequelize, DataTypes) => {
  // -----------------------------------------------------------------------
  // Define
  // -----------------------------------------------------------------------
  const user = sequelize.define('user', {
    UID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        min: 3,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: { type: DataTypes.STRING, allowNull: false },
    firstName: { type: DataTypes.STRING(50), allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
  });

  // -----------------------------------------------------------------------
  // Associations
  // -----------------------------------------------------------------------
  user.associate = function (models) {
    models.user.hasMany(models.membership, {
      onDelete: 'cascade',
      foreignKey: 'userUID',
    });

    models.user.hasMany(models.project, {
      onDelete: 'cascade',
      foreignKey: 'ownerUID',
    });

    models.user.hasMany(models.assignment, {
      onDelete: 'no action',
      foreignKey: 'assignTo',
    });
  };

  return user;
};
