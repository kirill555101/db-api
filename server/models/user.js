import db, { pgp } from '../db';

const user = {
  async findByNickname(nickname) {
    return await db.oneOrNone(
      `
        SELECT *
        FROM users
        WHERE nickname = $1
      `, [nickname]
    );
  },

  async findByNicknameOrEmail(nickname, email) {
    return await db.manyOrNone(
      `
        SELECT *
        FROM users
        WHERE (nickname = $1) OR (email = $2)
      `,
      [nickname, email]
    );
  },

  async getNickname(nickname) {
    return await db.oneOrNone(
      `
        SELECT nickname
        FROM users
        WHERE nickname = $1
      `,
      [nickname]
    );
  },

  async create(data = []) {
    try {
      return await db.oneOrNone(
        `
          INSERT INTO users(nickname, fullname, about, email)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
          RETURNING *
        `,
        data
      );
    } catch (e) {
      console.log(e);
    }
  },

  async update(nickname, columns, values) {
    try {
      let query = pgp.helpers.update(values, columns, { table: 'users' },null, { emptyUpdate: 'conflict' });
      query += ` WHERE nickname = '${nickname}' RETURNING *`;
      return await db.oneOrNone(query);
    }
    catch (e) {
      console.log(e);
    }
  },
}

export default user;
