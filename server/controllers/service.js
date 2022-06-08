import models from '../models';

const service = {
  async count(request, reply) {
    try {
      const result = await models.service.count();
      return reply.status(200).send(result);
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message : 'Server error' });
    }
  },

  async clear(request, reply) {
    try {
      await models.service.clear();
      reply.type('application/json').status(200);
      return null;
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message : 'Server error' });
    }
  }
}

export default service;
