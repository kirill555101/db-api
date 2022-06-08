import db from '../db';

const service = {
  async count() {
    const user = parseInt((await db.one('SELECT COUNT(*) FROM users')).count);
    const forum = parseInt((await db.one('SELECT COUNT(*) FROM forums')).count);
    const thread = parseInt((await db.one('SELECT COUNT(*) FROM threads')).count);
    const post = parseInt((await db.one('SELECT COUNT(*) FROM posts')).count);

    return { user, forum, thread, post };
  },

  async clear() {
    const user = await db.none('TRUNCATE TABLE users CASCADE');
    const forum = await db.none('TRUNCATE TABLE forums CASCADE');
    const thread = await db.none('TRUNCATE TABLE threads CASCADE');
    const post = await db.none('TRUNCATE TABLE posts CASCADE');

    return { user, forum, thread, post };
  }
}

export default service;
