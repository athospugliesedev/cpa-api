import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function postsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    await request.jwtVerify()
  })

  app.get('/posts', async (request) => {
    const posts = await prisma.post.findMany({
      where: {
        userId: request.user.sub,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return posts.map((post: { id: any; postUrl: any; content: string; createdAt: any }) => {
      return {
        id: post.id,
        coverUrl: post.postUrl,
        excerpt: post.content.substring(0, 115).concat('...'),
        createdAt: post.createdAt,
      }
    })
  })

  app.get('/posts/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const post = await prisma.post.findUniqueOrThrow({
      where: {
        id,
      },
    })

    if (!post.isPublic && post.userId !== request.user.sub) {
      return reply.status(401).send()
    }

    return post
  })

  app.post('/posts', async (request) => {
    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
      isPublic: z.coerce.boolean().default(false),
    })

    const { content, coverUrl, isPublic } = bodySchema.parse(request.body)

    const post = await prisma.post.create({
      data: {
        content,
        coverUrl,
        isPublic,
        userId: request.user.sub,
      },
    })

    return post
  })

  app.put('/posts/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
      isPublic: z.coerce.boolean().default(false),
    })

    const { content, coverUrl, isPublic } = bodySchema.parse(request.body)

    let post = await prisma.post.findUniqueOrThrow({
      where: {
        id,
      },
    })

    if (post.userId !== request.user.sub) {
      return reply.status(401).send()
    }

    post = await prisma.post.update({
      where: {
        id,
      },
      data: {
        content,
        coverUrl,
        isPublic,
      },
    })

    return post
  })

  app.delete('/posts/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(request.params)

    const post = await prisma.post.findUniqueOrThrow({
      where: {
        id,
      },
    })

    if (post.userId !== request.user.sub) {
      return reply.status(401).send()
    }

    await prisma.post.delete({
      where: {
        id,
      },
    })
  })
}
