import models from '../models';

import config from '../utils';

const user = {
  async create(request, reply) {
    const result = await models.user.create([
      request.params.nickname,
      request.body.fullname,
      request.body.about,
      request.body.email
    ]);
    if (result) {
      return reply.status(201).send(result);
    }

    try {
      const user = await models.user.findByNicknameOrEmail(request.params.nickname, request.body.email);
      return reply.status(409).send(user)
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message : 'Server error' })
    }
  },

  async find(request, reply) {
    try {
      const user = await models.user.findByNickname(request.params.nickname);
      if (user) {
        return reply.status(200).send(user);
      }
      return reply.status(404).send({ message: "Can't find user" })
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message: 'Server error' });
    }
  },

  async update(request, reply) {
    let user;
    try {
      user = await models.user.findByNickname(request.params.nickname);
      if (!user) {
        return reply.status(404).send({ message : "Can't find user" })
      }
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message : 'Server error' })
    }

    const values = config.getFilteredKeyValues(request.body);
    const columns = config.getFilteredColumns(request.body);

    if (!Object.values(request.body).length || !columns.length) {
      return reply.status(200).send(user);
    }

    const result = await models.user.update(request.params.nickname, columns, values);
    if (result) {
      return reply.status(200).send(result);
    }
    return reply.status(409).send({ message: "User with such nickname or email already exists" });
  }
}

export default user;
