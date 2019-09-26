module.exports = {
  development: {
    dialect: 'sqlite',
    storage: './db.development.sqlite'
  },
  development_mysql: {
    username: "backlog_admin",
    password: "backlog_admin",
    database: "backlog_db_test",
    host: "35.226.241.16",
    port: 3306,
    dialect: 'mysql',
    // disable logging; default: console.log
    logging: false
    //use_env_variable: 'DATABASE_URL'
  },
  test: {
    dialect: 'sqlite',
    storage: ':memory:'
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOSTNAME,
    port: 3306,
    dialect: 'mysql',
    logging: false
    //use_env_variable: 'DATABASE_URL'
  }
};
