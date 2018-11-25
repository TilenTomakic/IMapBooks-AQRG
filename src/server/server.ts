import * as Fastify        from 'fastify';
import { FastifyInstance } from 'fastify';
import { PredictService }  from "../predict/predict";
import { validate }        from "../validation/validation";

export class Server{
  fastify: FastifyInstance;

  constructor(public predictService: PredictService) {
    const fastify = Fastify({
      logger: true
    });

    fastify.post('/validate', async (request, reply) => {
      return validate();
    });

    fastify.post('/predict', async (request, reply) => {
      return this.predictService.predict(request.body);
    });

    fastify.register(require('fastify-static'), {
      root  : './public',
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
}
