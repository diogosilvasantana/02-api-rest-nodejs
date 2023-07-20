import { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";
import { randomUUID } from "crypto";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function transactionsRoutes(app: FastifyInstance) {
  
  // Listar todos
  app.get("/", { preHandler: [checkSessionIdExists] }, async (request) => {

    const { sessionId } = request.cookies;

    const transactions = await knex("transactions")
      .where('session_id', sessionId)
      .select();

    return { transactions };
  });

  // Buscar por id
  app.get("/:id", { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies;

    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionParamsSchema.parse(request.params);
    const transaction = await knex("transactions")
      .where({
        "session_id": sessionId,
        id
      })
      .first();

    return { transaction };
  });

  // Sumário (Soma todos os valores)
  app.get("/summary", { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies;

    const summary = await knex("transactions")
      .where("session_id", sessionId)
      .sum("amount", { as: "totalAmount" })
      .first();

    return { summary };
  });

  // Criar transações
  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(request.body);

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7
      })
    }

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId
    });

    return reply.status(201).send();
  });
}
