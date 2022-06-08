import fastify from 'fastify';

import controllers from './controllers';

const app = fastify({ logger: false });

app.post('/api/user/:nickname/create', controllers.user.create);
app.post('/api/user/:nickname/profile', controllers.user.update);
app.get('/api/user/:nickname/profile', controllers.user.find);

app.post('/api/forum/create', controllers.forum.create);
app.post('/api/forum/:slug/create', controllers.forum.createThread);
app.get('/api/forum/:slug/details', controllers.forum.find);
app.get('/api/forum/:slug/threads', controllers.forum.getThreads);
app.get('/api/forum/:slug/users', controllers.forum.findUsers);

app.post('/api/thread/:slug_or_id/create', controllers.thread.createPost);
app.post('/api/thread/:slug_or_id/vote', controllers.thread.vote);
app.get('/api/thread/:slug_or_id/details', controllers.thread.find);
app.get('/api/thread/:slug_or_id/posts', controllers.thread.getPosts);
app.post('/api/thread/:slug_or_id/details', controllers.thread.update);

app.get('/api/post/:id/details', controllers.post.find);
app.post('/api/post/:id/details', controllers.post.update);

app.get('/api/service/status', controllers.service.count);
app.post('/api/service/clear', controllers.service.clear);

app.addContentTypeParser('application/json', { parseAs: 'string' }, (_, body, done) => {
	try {
		const json = JSON.parse(body);
		done(null, json);
	} catch (e) {
		console.log(e);
		done(null, undefined);
	}
});

const port = 5000;

app.listen(port, '0.0.0.0', () => console.log(`Server listening port ${port}`));
