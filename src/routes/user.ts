import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

export async function userRoutes(app: FastifyInstance) {
  app.post('/users', async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
      name: z.string(),
      login: z.string(),
      avatarUrl: z.string(),
      courseName: z.string(),
    });

    try {
      const { email, password, name, login, avatarUrl, courseName } = bodySchema.parse(request.body);

      // Hash da senha antes de armazená-la no banco de dados
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          login,
          avatarUrl,
          courseName,
        },
      });

      const token = app.jwt.sign(
        {
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        {
          sub: user.id,
          expiresIn: '30 days',
        },
      );

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        login: user.login,
        avatarUrl: user.avatarUrl,
        courseName: user.courseName,
        token,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
      });
    }
  });

  app.post('/users/authenticate', async (request, reply) => {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    try {
      const { email, password } = bodySchema.parse(request.body);

      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        return reply.status(401).send({
          error: 'Invalid credentials',
        });
      }

      // Comparar a senha fornecida com a senha armazenada no banco de dados
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return reply.status(401).send({
          error: 'Invalid credentials',
        });
      }

      // Gere um token JWT ou qualquer lógica de autenticação desejada
      const token = app.jwt.sign(
        {
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
        {
          sub: user.id,
          expiresIn: '30 days',
        },
      );

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        login: user.login,
        avatarUrl: user.avatarUrl,
        courseName: user.courseName,
        token,
      };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
      });
    }
  });

  app.get('/users', async (request) => {
    try {
      const users = await prisma.user.findMany();

      return users.map((user) => {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          login: user.login,
          avatarUrl: user.avatarUrl,
          courseName: user.courseName,
        };
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        error: 'Internal Server Error',
      };
    }
  });

  
  app.get('/users/:id', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    try {
      const { id } = paramsSchema.parse(request.params);

      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'User not found',
        });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        login: user.login,
        avatarUrl: user.avatarUrl,
        courseName: user.courseName,
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
      });
    }
  });

  // Restante do código para as outras rotas
  // ...
}
