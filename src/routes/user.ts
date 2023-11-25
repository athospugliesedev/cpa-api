import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function userRoutes(app: FastifyInstance) {
  app.post('/users', async (request) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
      name: z.string(),
      login: z.string(),
      avatarUrl: z.string(),
      courseName: z.string(),
    })

    const { email, password, name, login, avatarUrl, courseName } = bodySchema.parse(request.body)

    const user = await prisma.user.create({
      data: {
        email,
        password,
        name,
        login,
        avatarUrl,
        courseName
      },
    })

    const token = app.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: '30 days',
      },
    )

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      login: user.login,
      avatarUrl: user.avatarUrl,
      courseName: user.courseName,
      token, // Incluindo o token na resposta
    }
  })

  // ... (código existente)

  app.put('/users/:id', async (request, reply) => {
    // ... (código existente)
  })

  app.delete('/users/:id', async (request, reply) => {
    // ... (código existente)
  })
}
