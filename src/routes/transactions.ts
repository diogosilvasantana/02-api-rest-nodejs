import { FastifyInstance } from "fastify";
import { z } from "zod";
import { knex } from "../database";
import { randomUUID } from "crypto";

export async function transactionsRoutes(app: FastifyInstance) {
  // Listar todos
  app.get("/", async () => {
    const transactions = await knex("transactions").select();

    return { transactions };
  });

  // Buscar por id
  app.get("/:id", async (request) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionParamsSchema.parse(request.params);
    const transaction = await knex("transactions").where("id", id).first();

    return { transaction };
  });

  // Sumário (Soma todos os valores)
  app.get("/summary", async () => {
    const summary = await knex("transactions")
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

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
    });

    return reply.status(201).send();
  });
}
