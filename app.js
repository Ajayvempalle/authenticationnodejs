const express = require('express')
const app = express()
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const dbpath = path.join(__dirname, 'userData.db')
let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is running at localhost:3000')
    })
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}

initializeDbAndServer()

const validatePassword = password => {
  return password.length > 4
}

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const userQuery = `select * from user where username='${username}'`
  const userData = await db.get(userQuery)
  if (userData === undefined) {
    if (validatePassword(password)) {
      const registerQuery = `insert into user(username,name,password,gender,location) values('${username}','${name}','${hashedPassword}','${gender}','${location}')`
      await db.run(registerQuery)
      response.status(200)
      response.send(`User created successfully`)
    } else {
      response.status(400)
      response.send(`Password is too short`)
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const userQuery = `select * from user where username=${username}`
  const data = await db.get(userQuery)
  if (data === undefined) {
    response.status(400)
    response.send(`Invalid user`)
  } else {
    const loginStatus = await bcrypt.compare(password, data.password)
    if (loginStatus) {
      response.status(200)
      response.send(`Login success!`)
    } else {
      response.status(400)
      response.send(`Invalid password`)
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const userQuery = `select * from user where username='${username}'`
  const userData = await db.get(userQuery)
  if (userData !== undefined) {
    const loginStatus = await bcrypt.compare(oldPassword, userData.password)
    if (loginStatus) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const changeQuery = `update user set password='${hashedPassword}' where username='${username}'`
        await db.run(changeQuery)
        response.status(200)
        response.send(`Password updated`)
      } else {
        response.status(400)
        response.send(`Password is too short`)
      }
    } else {
      response.status(400)
      response.send(`Invalid current password`)
    }
  } else {
    response.status(400)
    response.send(`user not exist`)
  }
})
module.exports = app
