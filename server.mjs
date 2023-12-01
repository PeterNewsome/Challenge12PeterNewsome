//const mysql = require('mysql2');
//const inquirer = require('inquirer');
import inquirer from 'inquirer';
import mysql from 'mysql2';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'Employees'
});

connection.connect(err => {
  if (err) throw err;
  runEmployeeTracker();
});

function runEmployeeTracker() {
    inquirer.prompt({
      name: 'action',
      type: 'list',
      message: 'What would you like to do?',
      choices: [
        '1. View all departments',
        '2. View all roles',
        '3. View all employees',
        '4. Add a department',
        '5. Add a role',
        '6. Add an employee',
        '7. Update an employee role',
        '8. Exit'
      ]
    }).then(answer => {
        switch (answer.action[0]) {
            case '1':
              viewDepartments();
              break;
            case '2':
              viewRoles();
              break;
            case '3':
              viewEmployees();
              break;
            case '4':
              addDepartment();
              break;
            case '5':
              addRole();
              break;
            case '6':
              addEmployee();
              break;
            case '7':
              updateEmployeeRole();
              break;
            case '8':
              connection.end();
              break;
            default:
              console.log('Invalid action, please choose from 1 to 8.');
              runEmployeeTracker();
          }    
    });
  }
  
  function viewDepartments() {
    // SQL query to select all departments
    connection.query('SELECT * FROM department', (err, results) => {
      if (err) throw err;
      console.table(results);
      runEmployeeTracker();
    });
  }  

  // View all roles
  function viewRoles() {
    connection.query('SELECT r.id, r.title, d.name AS department, r.salary FROM role r JOIN department d ON r.department_id = d.id', (err, results) => {
      if (err) throw err;
      console.table(results);
      runEmployeeTracker();
    });
  }
  
  // View all employees
  function viewEmployees() {
    connection.query(`
      SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
      FROM employee e
      JOIN role r ON e.role_id = r.id
      JOIN department d ON r.department_id = d.id
      LEFT JOIN employee m ON e.manager_id = m.id
    `, (err, results) => {
      if (err) throw err;
      console.table(results);
      runEmployeeTracker();
    });
  }
  
  // Add a department
  function addDepartment() {
    inquirer.prompt({
      name: 'departmentName',
      type: 'input',
      message: 'What is the name of the department?'
    }).then(answer => {
      connection.query('INSERT INTO department (name) VALUES (?)', [answer.departmentName], (err) => {
        if (err) throw err;
        console.log(`Added new department: ${answer.departmentName}`);
        runEmployeeTracker();
      });
    });
  }

  function addRole() {
    // First, we need to get the list of departments to let the user choose
    connection.query('SELECT id, name FROM department', (err, departments) => {
      if (err) throw err;
  
      inquirer.prompt([
        {
          name: 'title',
          type: 'input',
          message: 'What is the title of the role?',
        },
        {
          name: 'salary',
          type: 'input',
          message: 'What is the salary of the role?',
          validate: value => {
            if (isNaN(value) === false) {
              return true;
            }
            return 'Please enter a valid number for salary.';
          },
        },
        {
          name: 'department_id',
          type: 'list',
          choices: departments.map(department => ({
            name: department.name,
            value: department.id
          })),
          message: 'Which department does the role belong to?',
        }
      ]).then(answers => {
        connection.query('INSERT INTO role SET ?', {
          title: answers.title,
          salary: answers.salary,
          department_id: answers.department_id
        }, (err) => {
          if (err) throw err;
          console.log('The new role was created successfully!');
          runEmployeeTracker();
        });
      });
    });
  }

  function addEmployee() {
    // Get roles and employees for role_id and manager_id choices
    connection.query('SELECT id, title FROM role', (err, roles) => {
      if (err) throw err;
      connection.query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee', (err, employees) => {
        if (err) throw err;
  
        inquirer.prompt([
          {
            name: 'firstName',
            type: 'input',
            message: 'What is the employee\'s first name?',
          },
          {
            name: 'lastName',
            type: 'input',
            message: 'What is the employee\'s last name?',
          },
          {
            name: 'role_id',
            type: 'list',
            choices: roles.map(role => ({
              name: role.title,
              value: role.id
            })),
            message: 'What is the employee\'s role?',
          },
          {
            name: 'manager_id',
            type: 'list',
            choices: [{ name: 'None', value: null }].concat(
              employees.map(employee => ({
                name: employee.name,
                value: employee.id
              }))
            ),
            message: 'Who is the employee\'s manager?',
          }
        ]).then(answers => {
          connection.query('INSERT INTO employee SET ?', {
            first_name: answers.firstName,
            last_name: answers.lastName,
            role_id: answers.role_id,
            manager_id: answers.manager_id
          }, (err) => {
            if (err) throw err;
            console.log('The new employee was added successfully!');
            runEmployeeTracker();
          });
        });
      });
    });
  }

  function updateEmployeeRole() {
    // Get employees and roles to choose from
    connection.query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee', (err, employees) => {
      if (err) throw err;
      connection.query('SELECT id, title FROM role', (err, roles) => {
        if (err) throw err;
  
        inquirer.prompt([
          {
            name: 'employee_id',
            type: 'list',
            choices: employees.map(employee => ({
              name: employee.name,
              value: employee.id
            })),
            message: 'Which employee\'s role do you want to update?',
          },
          {
            name: 'role_id',
            type: 'list',
            choices: roles.map(role => ({
              name: role.title,
              value: role.id
            })),
            message: 'Which is the new role?',
          }
        ]).then(answers => {
          connection.query('UPDATE employee SET role_id = ? WHERE id = ?', [answers.role_id, answers.employee_id], (err) => {
            if (err) throw err;
            console.log('The employee\'s role was updated successfully!');
            runEmployeeTracker();
          });
        });
      });
    });
  }

  function exitApplication() {
    connection.end();
  }