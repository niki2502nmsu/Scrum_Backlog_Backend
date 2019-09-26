const express = require('express');
const bcrypt = require('bcrypt');
const models = require('../models');
const session = require('./session');
const sequelize = models.sequelize;

const router = express.Router();
const Op = models.Sequelize.Op;

router.route('/').get((req, res) => {
  res.json({ msg: 'Hello World!' });
});

router
  .route('/register')

  .post(session.notLoggedIn, (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
      models.user
        .create({
          username: req.body.username,
          email: req.body.email,
          password: hash,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
        })
        .then(user => {
          res.json({ msg: 'User created!' });
        })
        .catch((err) => {
          res.status(400);
          res.json({ msg: err.message });
        });
    });
  });

router
  .route('/createteam')
  .post(session.loggedIn, (req, res) =>{

    let errorMsg = '';
    let teamMembers = [req.session.user.username];
    if(req.body.members){
      teamMembers = teamMembers.concat(req.body.members);
    }

    return sequelize.transaction().then(t => {
      return models.team
      .create({
        name: req.body.name,
        description: req.body.description || '',
        ownerUID: req.session.user.id
      }, {transaction: t})
      .then(team => {
        models.user.findAll({
          attributes: ['UID'],
          where:{
            [Op.or]:[
              {username: {[Op.in]: teamMembers}},
              {email: {[Op.in]: teamMembers}}
            ]
          }
        }, {transaction: t})
        .then( userIDs => {
          let membershipObjects = userIDs.map(user=>{
            return {userUID: user.UID, teamUID: team.UID}
          });
          return models.membership.bulkCreate(membershipObjects, {transaction: t})
          .then(()=>{
            t.commit();
            res.json({ teamId: team.UID, msg: "Team Created!" });
            return;
          })
          .catch(err=>{
            errorMsg = err.message;
            t.rollback();  
            res.status(400);
            res.json({ msg: errorMsg || "Could not create team"});
          })

        })
        .catch(err => {  // finding user IDs failed
          errorMsg = err.message;
          t.rollback();
          res.status(400);
          res.json({ msg: errorMsg || "Could not create team"});
        })
      })
      .catch(err => {   // create team error
        errorMsg = err.message;
        t.rollback();
        res.status(400);
        res.json({ msg: errorMsg || "Could not create team"});
      })
    })
  })

router
  .route("/deleteteam")
  .post(session.loggedIn, (req, res) =>{
    models.team.destroy({
      where: {
        //UID: req.body.teamId,
        [Op.or]: [{UID: req.body.teamId || 0 }, {name: req.body.teamName || ''}],
        ownerUID: req.session.user.id
      }
    })
    .then((rowsAffected)=>{
      if(rowsAffected){
        res.json({ msg: "Team deleted!" });
      }
      else{
        res.status(400);
        res.json({ msg: "Invalid Team Name/ID" });  
      }
    })
    .catch(err=>{
      res.status(400);
      res.json({ msg: err.message });
    })
  });

router
  .route("/getteams")
  .post(session.loggedIn, (req, res) =>{
    let limit = req.body.paging && req.body.paging.limit? req.body.paging.limit : 10;
    let offset = req.body.paging && req.body.paging.offset? req.body.paging.offset : 0;
    let start = offset * limit;

    if(req.body.allTeams){  // get all teams
      sequelize.query("SELECT COUNT(UID) AS numTeams FROM teams",
      { type: sequelize.QueryTypes.SELECT})
      .then(team=>{
        let numTeams = team[0].numTeams;
        sequelize.query("SELECT * FROM teams ORDER BY UID ASC LIMIT ?,?",
        { replacements: [start, limit], type: sequelize.QueryTypes.SELECT})
        .then(teams => {
          let teamsList = teams.map(t =>{
            return {
              id: t.UID,
              name: t.name,
              description: t.description,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              ownerId: t.ownerUID
            }
          });
          res.json({ numTeams, teams: teamsList
          });
        })
        .catch(err=>{
          res.status(400);
          res.send({ msg: err.message });
        });
      })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      })
    }
    else{   // only get teams the user is member of
      models.membership.findAll({
        attributes: ['teamUID'],
        where: { userUID: req.session.user.id }
      })
      .then(memberships => {
        let userTeamsIDsList = memberships.map(m => {
          return m.teamUID
        })
        sequelize.query("SELECT COUNT(UID) AS numTeams FROM teams WHERE UID in (?)",
        { replacements: [userTeamsIDsList], type: sequelize.QueryTypes.SELECT})
        .then(team=>{
          let numTeams = team[0].numTeams;
          sequelize.query("SELECT * FROM teams WHERE UID in (?) ORDER BY UID ASC LIMIT ?,?",
          { replacements: [userTeamsIDsList, start, limit], type: sequelize.QueryTypes.SELECT})
          .then(teams => {
            let teamsList = teams.map(t =>{
              return {
                id: t.UID,
                name: t.name,
                description: t.description,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
                ownerId: t.ownerUID
              }
            });
            res.json({ numTeams, teams: teamsList});
          })
          .catch(err=>{
            res.status(400);
            res.send({ msg: err.message });
          });
        })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      })
    })
    .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
    });    
    } // else end
  });

router
  .route("/getteam")
  .post(session.loggedIn, (req, res) =>{
    
      models.team.findOne({
        where: { UID: req.body.teamId }
      })
      .then(team => {
        if(team){
          sequelize.query(
            "SELECT u.uid AS user_id, u.username, u.email, u.firstName, u.lastName, m.createdAt AS member_since " +
            "FROM users u, memberships m WHERE u.uid=m.userUID AND m.teamUID=?",
            { replacements: [team.UID], type: sequelize.QueryTypes.SELECT})
          .then( members => {
            let teamMembers = members.map(m=>{
              return {
                id: m.user_id, 
                username: m.username,
                email: m.email,
                firstName: m.firstName,
                lastName: m.lastName,
                member_since: m.member_since
              }
            })
            res.json({
              id: team.UID,
              name: team.name,
              description: team.description,
              createdAt: team.createdAt,
              updatedAt: team.updatedAt,
              ownerId: team.ownerId,
              members: teamMembers
            });
          })
          .catch(err=>{
            res.status(400);
            res.send({ msg: err.message });
          });
        }
        else{
          res.status(400);
          res.send({ msg: "Invalid team id" });  
        }
      })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      });
  });


router
  .route('/createproject')

  .post(session.loggedIn, (req, res) =>{

    if(req.body.teamName){  // team name passed instead of team id
      models.team.findOne({
        attributes: ['UID'],
        where: { name: req.body.teamName }
      })
      .then(team => {
        models.project.create({
          name: req.body.name,
          description: req.body.description,
          teamUID: team.UID,
          ownerUID: req.session.user.id
        })
        .then(project => {
          res.json({ id: project.UID, msg: 'Project Created!'});
        })
        .catch(err => {
          res.status(400);
          res.send({ msg: err.message });
        })
      })
      .catch(err => {
        res.status(400);
        res.send({ msg: err.message });
      })
    }

    else{   // team id passed
      models.project.create({
        name: req.body.name,
        description: req.body.description,
        teamUID: req.body.teamId,
        ownerUID: req.session.user.id
      })
      .then(project => {
        res.json({ id: project.UID, msg: 'Project Created!'});
      })
      .catch(err => {
        res.status(400);
        res.send({ msg: err.message });
      })
    }
  })

router
  .route("/deleteproject")
  .post(session.loggedIn, (req, res) =>{
    models.project.destroy({
      where: {
        //UID: req.body.projectId,
        [Op.or]: [{ UID: req.body.projectId || 0}, { name: req.body.projectName || '' }],
        ownerUID: req.session.user.id
      }
    })
    .then((rowsAffected)=>{
      if(rowsAffected){
        res.json({ msg: "Project deleted!" });
      }
      else{
        res.status(400);
        res.json({ msg: "Invalid project id" });  
      }
    })
    .catch(err=>{
      res.status(400);
      res.json({ msg: err.message });
    })
  });

  router
  .route("/getprojects")
  .post(session.loggedIn, (req, res) =>{

    let limit = req.body.paging && req.body.paging.limit? req.body.paging.limit : 10;
    let offset = req.body.paging && req.body.paging.offset? req.body.paging.offset : 0;
    let start = offset * limit;

    if(req.body.allProjects){  // get all projects
      sequelize.query("SELECT COUNT(UID) AS numProjects FROM projects",
      { type: sequelize.QueryTypes.SELECT})
      .then(project=>{
        let numProjects = project[0].numProjects;
        sequelize.query("SELECT * FROM projects ORDER BY UID ASC LIMIT ?,?",
        { replacements: [start, limit], type: sequelize.QueryTypes.SELECT})
        .then(projects => {
          let projectsList = projects.map(t =>{
            return {
              id: t.UID,
              name: t.name,
              description: t.description,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              teamId: t.teamUID,
              ownerId: t.ownerUID
            }
          });
          res.json({ numProjects, projects: projectsList
          });
        })
        .catch(err=>{
          res.status(400);
          res.send({ msg: err.message });
        });
      })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      })
    }
    else{   // only get projects the user is member of
      sequelize.query("SELECT COUNT(UID) AS numProjects FROM projects p WHERE p.teamUID IN "+
      "(SELECT teamUID FROM memberships m WHERE m.userUID=?) OR p.ownerUID=?;",
      { replacements: [req.session.user.id, req.session.user.id], type: sequelize.QueryTypes.SELECT})
      .then(project=>{
        let numProjects = project[0].numProjects;
        sequelize.query(
        "SELECT p.* FROM projects p, memberships m WHERE p.teamUID=m.teamUID AND m.userUID=? ORDER BY p.UID ASC LIMIT ?,?",
        { replacements: [req.session.user.id, start, limit], 
          type: sequelize.QueryTypes.SELECT})
        .then(projects => {
          let projectsList = projects.map(t =>{
            return {
              id: t.UID,
              name: t.name,
              description: t.description,
              createdAt: t.createdAt,
              updatedAt: t.updatedAt,
              teamId: t.teamUID,
              ownerId: t.ownerUID
            }
          });
          res.json({ numProjects, projects: projectsList});
        })
        .catch(err => {
          res.status(400);
          res.send({ msg: err.message });
        });
      })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      })
    }
  });

  router
  .route("/getproject")
  .post(session.loggedIn, (req, res) =>{
    
      models.project.findOne({
        where: { UID: req.body.projectId }
      })
      .then(project => {
        if(project){
          sequelize.query(
            "SELECT u.uid AS user_id, u.username, u.email, u.firstName, u.lastName " +
            "FROM users u, memberships m WHERE u.uid=m.userUID AND m.teamUID=?",
            { replacements: [project.teamUID], type: sequelize.QueryTypes.SELECT})
          .then( members => {
            let projectMembers = members.map(m=>{
              return {
                id: m.user_id, 
                username: m.username,
                email: m.email,
                firstName: m.firstName,
                lastName: m.lastName
              }
            })

            // find all sprints for this project
            models.sprint.findAll({
              where: { projectUID: req.body.projectId },
              order: [['startDate', 'ASC']]
            })
            .then(sprints => {
              let projectSprints = sprints.map(s=>{
                return {
                  id: s.UID,
                  description: s.description,
                  startDate: s.startDate,
                  endDate: s.endDate,
                  createdAt: s.createdAt,
                  updatedAt: s.updatedAt
                }
              })
              res.json({
                id: project.UID,
                name: project.name,
                description: project.description,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                teamId: project.teamUID,
                ownerId: project.ownerId,
                members: projectMembers,
                sprints: projectSprints
              });
            })
            .catch(err=>{
              res.status(400);
              res.send({ msg: err.message });
            })

          })
          .catch(err=>{
            res.status(400);
            res.send({ msg: err.message });
          });

        }
        else{
          res.status(400);
          res.send({ msg: 'Invalid project id' });  
        }
      })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      });
  });

  router
  .route("/createtask")
  .post(session.loggedIn, (req, res) =>{
    
      models.log.create({
        log: req.body.log,
        categoryID: req.body.categoryId,
        projectUID: req.body.projectId,
        statusID: req.body.statusId
      })
      .then(log => {
        res.json({
          id: log.UID,
          msg: "Task created!"
        });
      })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      });

  });

  router
  .route("/gettasks")
  .post(session.loggedIn, (req, res) =>{

    // set up pagination 
    let limit = req.body.paging && req.body.paging.limit? req.body.paging.limit : 10;
    let offset = req.body.paging && req.body.paging.offset? req.body.paging.offset : 0;
    let start = offset * limit;

    let bSprintTasks = req.body.sprintId && Number.isInteger(req.body.sprintId);
    let bStatusFilter = Array.isArray(req.body.status) && req.body.status.length > 0;
    let bCategoryFilter = Array.isArray(req.body.category) && req.body.category.length > 0;

    let q_num_tasks;
    let q_num_tasks_replacements;
    let q_tasks;
    let q_tasks_replacements

    if(!bSprintTasks){  // retrieve all tasks of the project
      q_num_tasks = "SELECT COUNT(UID) AS numTasks FROM logs WHERE projectUID=?";
      q_num_tasks_replacements = [req.body.projectId];

      q_tasks = "SELECT l.UID AS id, l.log AS name, l.createdAt, l.updatedAt, c.UID AS categoryId, "+
                    "c.name AS categoryName, s.UID AS statusId, s.name AS statusName "+
                    "FROM logs l, statuses s, categories c "+
                    "WHERE projectUID=? AND l.statusID=s.UID AND l.categoryID=c.UID";
      q_tasks_replacements = [req.body.projectId];                
      
      if(bStatusFilter){
        q_num_tasks += " AND statusID IN(?)";
        q_num_tasks_replacements.push(req.body.status);

        q_tasks += " AND l.statusID IN(?)";
        q_tasks_replacements.push(req.body.status);
      }

      if(bCategoryFilter){
        q_num_tasks += " AND categoryID IN(?)";
        q_num_tasks_replacements.push(req.body.category);

        q_tasks += " AND l.categoryID IN(?)";
        q_tasks_replacements.push(req.body.category);
      }
      q_num_tasks += ";";
      q_tasks += " ORDER BY l.UID ASC LIMIT ?,?;"; 
      q_tasks_replacements.push(start); 
      q_tasks_replacements.push(limit);
    }
    else{ // retrieve tasks for the specified sprint only
      q_num_tasks = "SELECT COUNT(logUID) AS numTasks from assignments a, logs l "+
                    "WHERE a.logUID=l.UID AND a.sprintUID=?";
      q_num_tasks_replacements = [req.body.sprintId];

      q_tasks = "SELECT res.*, u.username AS assigneeName FROM "+
                "(SELECT l.UID AS id, l.log AS name, l.createdAt, l.updatedAt, c.UID AS categoryId, c.name AS categoryName, "+
                "s.UID AS statusId, s.name AS statusName, a.estimate, a.assignTo AS assigneeId "+
                "FROM logs l, statuses s, categories c, assignments a "+
                "WHERE l.statusID=s.UID AND l.categoryID=c.UID AND l.UID=a.logUID AND a.sprintUID=?";
      q_tasks_replacements = [req.body.sprintId];                
      
      if(bStatusFilter){
        q_num_tasks += " AND statusID IN(?)";
        q_num_tasks_replacements.push(req.body.status);

        q_tasks += " AND l.statusID IN(?)";
        q_tasks_replacements.push(req.body.status);
      }

      if(bCategoryFilter){
        q_num_tasks += " AND categoryID IN(?)";
        q_num_tasks_replacements.push(req.body.category);

        q_tasks += " AND l.categoryID IN(?)";
        q_tasks_replacements.push(req.body.category);
      }
      q_num_tasks += ";";
      q_tasks += " ) AS res LEFT JOIN users AS u ON res.assigneeId=u.UID ORDER BY res.id ASC LIMIT ?,?;"; 
      q_tasks_replacements.push(start); 
      q_tasks_replacements.push(limit);
    }

      sequelize.query(q_num_tasks, 
      {replacements: q_num_tasks_replacements, type: sequelize.QueryTypes.SELECT})
      .then(task=>{
        let numTasks = task[0].numTasks || 0;
        sequelize.query(q_tasks,{ replacements: q_tasks_replacements, type: sequelize.QueryTypes.SELECT})
        .then(tasks=>{
          res.json({
            numTasks,
            tasks
          })
        })
        .catch(err=>{
          res.status(400);
          res.send({ msg: err.message });
        })
      })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      })    
  });

  router
  .route("/deletetask")
  .post(session.loggedIn, (req, res) =>{
    // TODO(aalbaltan) currently, any user can delete any task

    models.log.destroy({
      where: {
        UID: req.body.taskId
      }
    })
    .then((rowsAffected)=>{
      if(rowsAffected){
        res.json({ msg: "Task deleted!" });
      }
      else{
        res.status(400);
        res.json({ msg: "Invalid task id" });  
      }
    })
    .catch(err=>{
      res.status(400);
      res.json({ msg: err.message });
    })
  });

router
  .route("/createsprint")
  .post(session.loggedIn, (req, res) =>{

    let bSprintIncludesTasks = Array.isArray(req.body.tasks) && req.body.tasks.length > 0;

    let sDate = req.body.startDate || Date.now();
    let eDate = req.body.endDate || Date.now() + (1000 * 60 * 60 * 24 * 30);

    //sDate.setHours(0,0,0,0);
    //eDate.setHours(0,0,0,0);

    // make sure created sprint does not overlap with existing sprints
    models.sprint.findAll({
      where:{
        projectUID: req.body.projectId,
        startDate: {[Op.lte]: eDate },
        endDate:   {[Op.gte]: sDate }
      }
    })
    .then(sprints=>{
      if(sprints && sprints.length > 0){
        res.status(400);
        res.send({ msg: "sprint overlaps with another sprint" });
      }
      else{
        return sequelize.transaction()
        .then(t => {
          return models.sprint.create({
            description: req.body.description,
            startDate: sDate,
            endDate: eDate,
            projectUID: req.body.projectId
          }, {transaction: t})
          .then(sprint => {
            if(bSprintIncludesTasks){
              let sprintTasks = req.body.tasks.map(e=>{
                return {
                    logUID: e.taskId,
                    sprintUID: sprint.UID,
                    estimate: e.estimate,
                    assignTo: e.assigneeId
                };
              });
              return models.assignment.bulkCreate(sprintTasks, {transaction: t})
              .then(()=>{
                let tasks_ids = req.body.tasks.map(e=>{
                  return e.taskId;
                })

                return models.log.update(
                  {statusID: 21},
                  {
                    where: {UID: {[Op.in]: tasks_ids }},
                    transaction: t
                  })
                .then(([affectedCount, affectedRows]) => {
                  t.commit();
                  res.json({ sprintId: sprint.UID, msg: "Sprint created!"});    
                })
                .catch(err=>{
                  t.rollback();
                  res.status(400);
                  res.send({ msg: err.message });
                })
              })
              .catch(err=>{
                t.rollback();
                res.status(400);
                res.send({ msg: err.message });
              })
            }
            else{  // create sprint that includes no tasks
              t.commit();
              res.json({ sprintId: sprint.UID, msg: "Sprint created!"});
            }
          })
          .catch(err=>{
            t.rollback();
            res.status(400);
            res.send({ msg: err.message });
          });
        });
      }
    })
    .catch(err=>{
      res.status(400);
      res.send({ msg: err.message });
    });
});

router
  .route("/deletesprint")
  .post(session.loggedIn, (req, res) =>{

    let sql = "UPDATE logs SET statusID=20 WHERE UID IN(SELECT a.logUID FROM assignments a WHERE a.sprintUID="+req.body.sprintId+");";

    return sequelize.transaction()
    .then(t => {
      return sequelize
      .query(sql, {type: sequelize.QueryTypes.BULKUPDATE, transaction: t})
      .then(()=>{
        return models.sprint.destroy({
          where: {
            UID: req.body.sprintId
          },
          transaction: t
        })
        .then((rowsAffected)=>{
          if(rowsAffected){
            t.commit();
            res.json({ msg: "Sprint deleted!" });
          }
          else{
            t.rollback();
            res.status(400);
            res.json({ msg: "Invalid sprint id" });  
          }
        })
        .catch(err=>{
          t.rollback();
          res.status(400);
          res.json({ msg: err.message });
        })
      })
      .catch(err=>{
        t.rollback();
        res.status(400);
        res.json({ msg: err.message });  
      });
    })
    .catch(err=>{
      res.status(400);
      res.json({ msg: err.message });  
    });
  });

router
  .route("/getsprint")
  .post(session.loggedIn, (req, res) =>{

    let bCurrentSprint = req.body.projectId && Number.isInteger(req.body.projectId);

    // set up pagination 
    let limit = req.body.paging && req.body.paging.limit? req.body.paging.limit : 10;
    let offset = req.body.paging && req.body.paging.offset? req.body.paging.offset : 0;
    let start = offset * limit;

    if(bCurrentSprint){ // return current sprint only
      sequelize.query("SELECT COUNT(logUID) AS numTasks, sprintUID from assignments a WHERE a.sprintUID IN"+
      "(SELECT UID FROM sprints WHERE projectUID=? AND SYSDATE() BETWEEN DATE(startDate) AND DATE(endDate)) GROUP BY sprintUID", 
      {replacements: [req.body.projectId], type: sequelize.QueryTypes.SELECT})
      .then(task=>{  
        let numTasks = task[0].numTasks || 0;
        sequelize.query(
          "SELECT s.UID AS id, s.description, s.startDate, s.endDate, s.projectUID AS projectId, p.name AS projectName "+
          "FROM sprints s, projects p "+
          "WHERE s.projectUID=p.UID AND s.UID=?;",
          { replacements: [task[0].sprintUID], type: sequelize.QueryTypes.SELECT})
          .then(sprint=>{
            if(!sprint || sprint.length == 0){
              res.status(400);
              res.send({ msg: "No current sprint" });    
              return;
            }
            sequelize.query(
              "SELECT res.*, u.username AS assigneeName FROM "+
              "(SELECT l.UID AS id, l.log AS name, c.UID AS categoryId, c.name AS categoryName, "+
              "s.UID AS statusId, s.name AS statusName, a.estimate, a.assignTo AS assigneeId "+
              "FROM logs l, statuses s, categories c, assignments a "+
              "WHERE a.logUID=l.UID AND l.statusID=s.UID AND l.categoryID=c.UID AND a.sprintUID=?) "+
              "AS res LEFT JOIN users AS u ON res.assigneeId=u.UID ORDER BY res.id ASC LIMIT ?,?;",
              { replacements: [sprint[0].id, start, limit], type: sequelize.QueryTypes.SELECT})
              .then(tasks=>{
                res.json({
                  id: sprint[0].id,
                  description: sprint[0].description,
                  startDate: sprint[0].startDate,
                  endDate: sprint[0].endDate,
                  projectId: sprint[0].projectId,
                  projectName: sprint[0].projectName,
                  numTasks,
                  tasks
                })
              })
              .catch(err=>{
                res.status(400);
                res.send({ msg: err.message });    
              })
          })
          .catch(err=>{
            res.status(400);
            res.send({ msg: err.message });
          })
      })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      })
    }
    else{
      sequelize.query("SELECT COUNT(logUID) AS numTasks from assignments a WHERE a.sprintUID=?", 
      {replacements: [req.body.sprintId], type: sequelize.QueryTypes.SELECT})
      .then(task=>{
        let numTasks = task[0].numTasks || 0;
        sequelize.query(
          "SELECT s.UID AS id, s.description, s.startDate, s.endDate, s.projectUID AS projectId, p.name AS projectName "+
          "FROM sprints s, projects p "+
          "WHERE s.projectUID=p.UID AND s.UID=?;",
          { replacements: [req.body.sprintId], type: sequelize.QueryTypes.SELECT})
          .then(sprint=>{
            if(!sprint || sprint.length == 0){
              res.status(400);
              res.send({ msg: "Sprint not found" });    
              return;
            }
            sequelize.query(
              "SELECT res.*, u.username AS assigneeName FROM "+
              "(SELECT l.UID AS id, l.log AS name, c.UID AS categoryId, c.name AS categoryName, "+
              "s.UID AS statusId, s.name AS statusName, a.estimate, a.assignTo AS assigneeId "+
              "FROM logs l, statuses s, categories c, assignments a "+
              "WHERE a.logUID=l.UID AND l.statusID=s.UID AND l.categoryID=c.UID AND a.sprintUID=?) "+
              "AS res LEFT JOIN users AS u ON res.assigneeId=u.UID ORDER BY res.id ASC LIMIT ?,?;",
              { replacements: [req.body.sprintId, start, limit], type: sequelize.QueryTypes.SELECT})
              .then(tasks=>{
                res.json({
                  id: sprint[0].id,
                  description: sprint[0].description,
                  startDate: sprint[0].startDate,
                  endDate: sprint[0].endDate,
                  projectId: sprint[0].projectId,
                  projectName: sprint[0].projectName,
                  numTasks,
                  tasks
                })
              })
              .catch(err=>{
                res.status(400);
                res.send({ msg: err.message });    
              })
          })
          .catch(err=>{
            res.status(400);
            res.send({ msg: err.message });
          })
      })
      .catch(err=>{
        res.status(400);
        res.send({ msg: err.message });
      })
    }
    
});

module.exports = router;