import * as Fastify                        from 'fastify';
import { FastifyInstance }                 from 'fastify';
import * as path                           from "path";
import { predictService }                  from "../predict";

export const Server = new class {
  fastify: FastifyInstance;

  constructor() {
    const fastify = Fastify({
      logger: true
    });

    fastify.post('predict', async (request, reply) => {
      return predictService.predict(request.body);
    });

    fastify.register(require('fastify-static'), {
      root  : path.join(__dirname, 'public'),
      prefix: '/',
    });

    this.fastify = fastify;
  }

  listen() {
    this.fastify.listen(8080, (err, address) => {
      if (err) {
        throw err;
      }
      this.fastify.log.info(`server listening on ${address}`)
    });
  }
};

