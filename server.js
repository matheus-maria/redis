const express = require('express')
const fetch = require('node-fetch')
const redis = require('redis')

// Variables
const PORT = process.env.PORT || 5000
const REDIS_PORT = process.env.PORT || 6379

const client = redis.createClient(REDIS_PORT)
const app = express()

// Set reponse
var setResponse = (username, repos) => {
   return `<h2>${username} has ${repos} Github repos</h2>`
}

// Request to Github
var getRepos = async (req, res, next) => {

   try {

      console.log('Fetcheing Data ...')

      let { username } = req.params

      let response = await fetch(`https://api.github.com/users/${username}`)

      let data = await response.json()

      const repos = data.public_repos

      // Set data to Redis
      client.setex(username, 3600, repos)

      res.send(setResponse(username, repos))
   }
   catch (err) {
      console.log(`Error : ${err}`)
      res.status(500)
   }

}

// Cache Middleware
var cache = (req, res, next) => {

   let { username } = req.params

   client.get(username, (err, data) => {

      if(err) throw err

      if(data !== null) res.send(setResponse(username, data))      
      else next()

   })
}

app.get('/repos/:username', cache, getRepos)

app.listen(PORT, () => {
   console.log(`App listening on port ${PORT}`)
})
