import models from '../models';

import config from '../utils';

const forum = {
	async create(request, reply) {
		let user
		try {
			user = await models.user.getNickname(request.body.user);
			if (!user) {
				return reply.status(404).send({ message : "Can't find user" })
			}
		} catch (e) {
			console.log(e);
			return reply.status(500).send({ message : 'Server error' })
		}

		const result = await models.forum.create([request.body.slug, request.body.title, user.nickname ]);
		if (result) {
			return reply.status(201).send(result);
		}

		try {
			const forum = await models.forum.findAllBySlug(request.body.slug);
			return reply.status(409).send(forum)
		} catch (e) {
			console.log(e);
			return reply.status(500).send({ message : 'Server error' })
		}
	},

	async find(request, reply) {
		try {
			const data = await models.forum.findAllBySlug(request.params.slug);
			if (data) {
				return reply.status(200).send(data);
			}
			return reply.status(404).send({ message: "Can't find forum" });
		} catch (e) {
			console.log(e);
			return reply.status(500).send({ message: 'Server error' });
		}
	},

	async createThread(request, reply) {
		let author;
		try {
			author = await models.user.getNickname(request.body.author);
			if (!author) {
				return reply.status(404).send({ message : "Can't find user" })
			}
		} catch (e) {
			console.log(e);
			return reply.status(500).send({ message : 'Server error' })
		}

		let forum;
		try {
			forum = await models.forum.findSlug(request.params.slug);
			if (!forum) {
				return reply.status(404).send({ message : "Can't find forum" })
			}
		} catch (e) {
			console.log(e);
			return reply.status(500).send({ message : 'Server error' })
		}

		const keyValues = config.getFilteredKeyValues(request.body);

		keyValues['author'] = author.nickname;
		keyValues['forum'] = forum.slug;

		const columns = config.getFilteredColumns(keyValues).map((column) => {
			if (column === 'message' || column === 'created') {
				column = '"' + column + '"';
			}
			return column;
		});
		const values = config.getFilteredValues(keyValues);

		const result = await models.thread.create(columns, values);
		if (!result) {
			try {
				const thread = await models.thread.findBySlug(request.body.slug);
				thread.id = parseInt(thread.id);
				return reply.status(409).send(thread)
			} catch (e) {
				console.log(e);
				return reply.status(500).send({ message: 'Server error' })
			}
		}

		try {
			await models.forum.createUser(forum.slug, author.nickname)
		} catch (e) {
			console.log(e);
			return reply.status(500).send({ message : 'Server error' })
		}

		try {
			await models.forum.incrementThreads(forum.slug);
			result.id = parseInt(result.id);
			return reply.status(201).send(result);
		} catch (e) {
			console.log(e);
			return reply.status(500).send({ message : 'Server error' })
		}
	},

	async getThreads(request, reply) {
		const params = config.getFilteredKeyValues(request.query);
		params['limit'] = params['limit']
			? parseInt(params['limit'])
			: 10;

		let result = config.getArrayWithIntId(await models.thread.findAllBySlug(request.params.slug, params));
		if (result && result.length) {
			return reply.status(200).send(result);
		}

		const forum = await models.forum.findSlug(request.params.slug);
		if (forum) {
			return reply.status(200).send(result);
		}
		return reply.status(404).send({ message: "Can't find forum" });
	},

	async findUsers(request, reply) {
		const params = config.getFilteredKeyValues(request.query);
		params['limit'] = params['limit']
			? parseInt(params['limit'])
			: 10;
		params.desc = params.desc === 'true';

		let result = await models.forum.findUsers(request.params.slug, params);
		if (result && result.length) {
			result = config.forumSerializer(result);
			return reply.status(200).send(result);
		}

		const forum = await models.forum.findSlug(request.params.slug);
		if (forum) {
			return reply.status(200).send(result);
		}
		return reply.status(404).send({ message: "Can't find forum" });
	}
}

export default forum;
