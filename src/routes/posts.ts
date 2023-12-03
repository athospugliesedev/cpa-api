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
    });
  
    return posts.map((post) => {
      return {
        id: post.id,
        title: post.title,
        content: post.content, 
        createdAt: post.createdAt,
        rating: post.rating,
      };
    });
  });

  app.get('/posts/all', async (request, reply) => {
    try {
      const posts = await prisma.post.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
  
      const formattedPosts = posts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        rating: post.rating,
      }));
  
      return formattedPosts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
      });
    }
  });
    

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

    return post
  })

  app.post('/posts', async (request) => {
    const bodySchema = z.object({
      content: z.string(),
      title: z.string(),
      rating: z.number().int().nullable(), 
    })

    const { content, title, rating } = bodySchema.parse(request.body)

    const post = await prisma.post.create({
      data: {
        content,
        title,
        userId: request.user.sub,
        rating,
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
      title: z.string(),
      isPublic: z.coerce.boolean().default(false),
      rating: z.number().int().nullable(), 
    })

    const { content, title, isPublic, rating } = bodySchema.parse(request.body)

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
        title,
        rating,
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
  })};
