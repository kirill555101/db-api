import models from '../models';

import config from '../utils';

const thread = {
  async createPost(request, reply) {
    let slugOrId = request.params['slug_or_id'];
    let thread;

    if (/^\d+$/.test(slugOrId)) {
      try {
        thread = await models.thread.findById(parseInt(slugOrId));
      } catch (e) {
        console.log(e);
        return reply.status(500).send({ message : 'Server error' });
      }
    } else {
      try {
        thread = await models.thread.findBySlug(slugOrId);
      } catch (e) {
        console.log(e);
        return reply.status(500).send({ message : 'Server error' });
      }
    }

    if (!thread) {
      return reply.status(404).send({ mesage : "Can't find thread" });
    }

    const postsValues = [];
    const forumUserPairValues = [];
    const creationDate = new Date().toUTCString();
    const newPosts = request.body;

    if (!newPosts.length) {
      return reply.status(201).send([]);
    }

    for (let post of newPosts) {
      if (post.parent) {
        try {
          const parentPost = await models.post.findByIdAndThreadId(post.parent, thread.id);
          if (!parentPost) {
            return reply.status(409).send({ message: 'no parent posts' });
          }
          post.parent = parentPost.id;
        } catch (e) {
          console.log(e);
          return reply.status(500).send({ message: 'Server error' })
        }
      } else {
        post.parent = null;
      }

      forumUserPairValues.push([post.author, thread.forum]);

      const postId = await models.post.getNextId();
      post.created = creationDate;
      post.thread = thread.id;
      post.forum = thread.forum;
      post.id = parseInt(postId.nextval);

      const idString = config.constructPathString([post.id]);
      if (!post.parent) {
        post.pathtopost = post.pathtopost || idString;
      } else {
        const path = await models.post.getPathtopost(post.parent);
        path.pathtopost.push(post.id);
        const pathString = config.constructPathString(path.pathtopost);
        post.pathtopost = post.pathtopost || pathString || idString;
      }

      postsValues.push(post);
    }

    const valuesInStringQuery = config.getValueString(postsValues);
    const addedPosts = await models.post.createByQuery(valuesInStringQuery);

    if (!addedPosts) {
      return reply.status(404).send({ message: "Can't find author" });
    }

    const result = addedPosts.map((post) => {
      const id = parseInt(post.id);
      const thread = parseInt(post.thread);
      const parent = parseInt(post.parent);

      return { ...post, id, thread, parent };
    });

    try {
      await models.forum.incrementPosts(thread.forum, newPosts.length);

      const stringPairValues = config.createPairsQuery(forumUserPairValues);
      await models.forum.createUserByQuery(stringPairValues);
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message: 'Server error' })
    }

    return reply.status(201).send(result);
  },

  async vote(request, reply) {
    const slugOrId = request.params['slug_or_id'];
    const voiceValue = request.body.voice;

    let author = request.body.nickname;

    let thread;
    if (/^\d+$/.test(slugOrId)) {
      try {
        thread = await models.thread.findById(parseInt(slugOrId));
      } catch (e) {
        console.log(e);
        return reply.status(500).send({ message : 'Server error' });
      }
    } else {
      try {
        thread = await models.thread.findBySlug(slugOrId);
      } catch (e) {
        console.log(e);
        return reply.status(500).send({ message : 'Server error' });
      }
    }

    if (!thread) {
      return reply.status(404).send({ mesage : "Can't find thread" });
    }

    const votedData = await models.vote.create(voiceValue, thread.id, author);

    if (votedData) {
      if (votedData.existed) {
        votedData.voice = votedData.voice === 1 ? votedData.voice + 1 : votedData.voice - 1;
      }
    } else {
      try {
        author = await models.user.getNickname(author);
        if (!author) {
          return reply.status(404).send({ message : "Ca't find author" });
        } else {
          thread.id = parseInt(thread.id);
          return reply.status(200).send(thread);
        }
      } catch (e) {
        console.log(e);
        return reply.status(500).send({ message : 'Server error' })
      }
    }

    try {
      const result = await models.thread.incrementVotesById(thread.id, votedData.voice);

      result.id = parseInt(result.id);
      return reply.status(200).send(result);
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message : 'Server error' });
    }
  },

  async find(request, reply) {
    const slugOrId = request.params['slug_or_id'];
    try {
      const thread = /^\d+$/.test(slugOrId)
        ? await models.thread.findById(parseInt(slugOrId))
        : await models.thread.findBySlug(slugOrId);

      if (!thread) {
        return reply.status(404).send({ mesage: "Can't find thread" });
      }

      thread.id = parseInt(thread.id);
      return reply.status(200).send(thread);
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message: 'Server error' });
    }
  },

  async getPosts(request, reply) {
    const params = config.getFilteredKeyValues(request.query);
    params['limit'] = params['limit']
      ? parseInt(params['limit'])
      : 10;

    params['desc'] = params['desc'] === 'true';
    params['since'] = parseInt(params['since']);

    const slugOrId = request.params['slug_or_id'];
    const isId = /^\d+$/.test(slugOrId);

    let result = [];
    if (params.sort === 'flat' || !params.sort) {
      result = await models.post.flatSort(slugOrId, isId, params);
    } else if (params.sort === 'tree') {
      result = await models.post.treeSort(slugOrId, isId, params);
    } else if (params.sort === 'parent_tree') {
      result = await models.post.parentTreeSort(slugOrId, isId, params);
    }

    if (!result || !result.length) {
      const thread = isId
        ? await models.thread.findById(parseInt(slugOrId))
        : await models.thread.findBySlug(slugOrId);

      if (thread) {
        return reply.status(200).send(result);
      }
      return reply.status(404).send({ message : "Can't find thread" });
    }

    result = result.map((post) => {
      const id = parseInt(post.id);
      const parent = parseInt(post.parent);
      const thread = parseInt(post.thread);

      return { ...post, id, parent, thread };
    });
    return reply.status(200).send(result);
  },

  async update(request, reply) {
    const slugOrId = request.params['slug_or_id'];

    const values = config.getFilteredKeyValues(request.body);
    const columns = config.getFilteredColumns(request.body);

    let thread;
    try {
      thread = /^\d+$/.test(slugOrId)
        ? await models.thread.findById(parseInt(slugOrId))
        : await models.thread.findBySlug(slugOrId);

      if (!thread) {
        return reply.status(404).send({ message: "Can't find thread" });
      }
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message: 'Server error' });
    }

    if (!Object.values(request.body).length || !columns.length) {
      thread.id = parseInt(thread.id);
      return reply.status(200).send(thread);
    }

    try {
      const result = await models.thread.update(thread.slug, columns, values);
      if (result === 'conflict') {
        return reply.status(409).send({ message: 'Already existed data' });
      }

      result.id = parseInt(result.id);
      return reply.status(200).send(result);
    } catch (e) {
      console.log(e);
      return reply.status(500).send({ message : 'Server error' });
    }
  }
}

export default thread;
