import models from '../models';

const post = {
  async find(request, reply) {
    const postId = request.params['id'];
    const result = {};

    let postData;
    try {
      postData = await models.post.findById(postId);
      if (!postData) {
        return reply.status(404).send({ message: "Can't find post" });
      }
    } catch (e) {
      console.log(e);
    }

    const relatedTo = request.query['related'];
    let entity;
    if (relatedTo) {
      const relatedEntities = relatedTo.split(',');
      for (let relatedEntity of relatedEntities) {
        if (relatedEntity === 'user') {
          try {
            entity = await models.user.findByNickname(postData.author);
            result.author = entity;
          } catch (e) {
            console.log(e);
          }
        } else if (relatedEntity === 'thread') {
          try {
            entity = await models.thread.findById(postData.thread);
            entity.id = parseInt(entity.id);
            result.thread = entity;
          } catch (e) {
            console.log(e);
          }
        } else if (relatedEntity === 'forum') {
          try {
            entity = await models.forum.findAllBySlug(postData.forum);
            result.forum = entity;
          } catch (e) {
            console.log(e);
          }
        }
      }
    }

    postData.id = parseInt(postData.id);
    postData.thread = parseInt(postData.thread);
    postData.parent = parseInt(postData.parent);

    result.post = postData;
    return reply.status(200).send(result);
  },

  async update(request, reply) {
    const postId = request.params['id'];
    const data = request.body;

    let postData;
    try {
      postData = await models.post.findById(postId);
      if (!postData) {
        return reply.status(404).send({ message: "Can't find post" });
      }
    } catch (e) {
      console.log(e);
    }

    if (!Object.values(data).length || data.message === '') {
      postData.id = parseInt(postData.id);
      postData.thread = parseInt(postData.thread);
      postData.parent ? parseInt(postData.parent) : postData.parent;
      return reply.status(200).send(postData);
    }

    if (postData.message === data.message) {
      postData.id = parseInt(postData.id);
      postData.thread = parseInt(postData.thread);
      postData.parent ? parseInt(postData.parent) : postData.parent;
      return reply.status(200).send(postData);
    }

    let result;
    try {
      result = await models.post.update(data.message, postId);
      if (result === 'conflict') {
        return reply.status(409).send({ message: 'already existed data' });
      }
    } catch (e) {
      console.log(e);
    }

    result.id = parseInt(result.id);
    result.thread = parseInt(result.thread);
    result.parent ? parseInt(result.parent) : result.parent;

    return reply.status(200).send(result);
  }
}

export default post;
