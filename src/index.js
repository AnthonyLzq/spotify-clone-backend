import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import lyricsFinder from 'lyrics-finder'
import SpotifyWebApi from 'spotify-web-api-node'

const app = express()
app.use(express.json())
app.use(cors())
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: false }))
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.get('/', (req, res) => res.status(200).send({
  message: 'Welcome to my Spotify api'
}))

app.post('/login', async (req, res) => {
  const { body: { code } } = req
  const spotifyApi = new SpotifyWebApi({
    redirectUri : 'http://localhost:3000',
    clientId    : process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  })

  try {
    const data = await spotifyApi.authorizationCodeGrant(code)

    const { body: { access_token, refresh_token, expires_in } } = data
    res.status(200).send({
      accessToken : access_token,
      refreshToken: refresh_token,
      expiresIn   : expires_in
    })
  } catch (error) {
    console.error(error)
    res.status(400).send({
      message: 'There was an error while trying to authorize the page'
    })
  }
})

app.post('/refresh', async (req, res) => {
  const { body: { refreshToken } } = req
  const spotifyApi = new SpotifyWebApi({
    redirectUri : 'http://localhost:3000',
    clientId    : process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken
  })

  try {
    const data = await spotifyApi.refreshAccessToken()
    const {
      body: {
        access_token: accessToken,
        expires_in  : expiresIn
      }
    } = data

    res.status(200).send({
      accessToken,
      expiresIn
    })
  } catch (error) {
    console.error(error)
    res.status(400).send({
      message: 'There was an error while trying to refresh the token'
    })
  }
})

app.get('/lyrics', async(req, res) => {
  const { query: { artist, title } } = req

  try {
    const lyrics = await lyricsFinder(artist, title) || 'No lyrics found'
    res.status(200).send({ lyrics })
  } catch (error) {
    console.error(error)
    res.status(404).send({ lyrics: 'No lyrics found' })
  }
})

const PORT = parseInt(process.env.PORT)

app.listen(PORT, () => console.log(`Server running at port: ${PORT}`))
