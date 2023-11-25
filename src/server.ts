import 'dotenv/config'

import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { postsRoutes } from './routes/posts'
import { userRoutes } from './routes/user'

const app = fastify()


app.register(cors, {
  origin: true,
})

app.register(jwt, {
  secret: 'secrejwt',
})

app.register(userRoutes)
app.register(postsRoutes)

app
  .listen({
    port: 3030,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log('HTTP server running on port http://localhost:3030')
  })
