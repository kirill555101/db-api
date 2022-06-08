import db, { pgp } from '../db';

const forum = {
  async findSlug(slug) {
    return await db.oneOrNone(
      `
        SELECT slug
        FROM forums
        WHERE slug = $1
      `,
      [slug]
    );
  },

  async findAllBySlug(slug) {
    return await db.oneOrNone(
      `
        SELECT *
        FROM forums
        WHERE slug = $1
      `,
      [slug]
    );
  },

  async incrementThreads(slug) {
    return await db.oneOrNone(
      `
        UPDATE forums
        SET threads = threads + 1
        WHERE slug = $1
        RETURNING *
      `,
      [slug]
    );
  },

  async incrementPosts(slug, count) {
    return await db.oneOrNone(
      `
        UPDATE forums
        SET posts = posts + $2
        WHERE slug = $1
        RETURNING *
      `,
      [slug, count]
    );
  },

  async create(data = []) {
    try {
      return await db.oneOrNone(
        `
          INSERT INTO forums(slug, title, "user")
          VALUES ($1, $2, $3)
          ON CONFLICT DO NOTHING
          RETURNING *
        `,
        data
      );
    } catch (e) {
      console.log(e);
    }
  },

  async createUser(slug, nickname) {
    try {
      return await db.oneOrNone(
        `
          INSERT INTO forums_users(slug, nickname)
          VALUES (
            $1,
            (
              SELECT nickname
              FROM users
              WHERE nickname = $2
            )
          )
          ON CONFLICT ON CONSTRAINT forums_users_unique_slug_nickname DO NOTHING
          RETURNING *
        `,
        [slug, nickname]
      );
    } catch(e) {
      console.log(e);
    }
  },

  async createUserByQuery(stringPairValues) {
    try {
      return await db.oneOrNone(
        `
          INSERT INTO forums_users (nickname, slug)
          VALUES ${stringPairValues}
          ON CONFLICT ON CONSTRAINT forums_users_unique_slug_nickname DO NOTHING
          RETURNING *
        `
      );
    } catch (e) {
      console.log(e);
    }
  },

  async findUsers(slug, params) {
    try {
      slug =
        `
          (
            SELECT slug
            FROM forums
            WHERE slug = '${slug}'
          )
        `;

      let query;
      if (params.since) {
        if (params.desc) {
          query = pgp.as.format(
            `
              SELECT * FROM forums_users AS FU
              JOIN users AS U ON FU.nickname = U.nickname
              WHERE (FU.slug = $1:raw) AND (U.nickname < $2)
            `,
            [slug, params.since]
          );
        } else {
          query = pgp.as.format(
            `
              SELECT * FROM forums_users AS FU
              JOIN USERS AS U ON FU.nickname = U.nickname
              WHERE (FU.slug = $1:raw) AND (U.nickname > $2)
            `,
            [slug, params.since]
          );
        }
      } else {
        query = pgp.as.format(
          `
            SELECT * FROM forums_users AS FU
            JOIN users AS U ON FU.nickname = U.nickname
            WHERE FU.slug = $1:raw
          `,
          [slug]
        );
      }

      return await db.manyOrNone(
        `
          $1:raw
          ORDER BY $2:raw
          LIMIT $3
        `,
        [
          query.toString(),
          (params.desc ? 'U.nickname DESC' : 'U.nickname ASC'),
          params.limit
        ]
      );
    } catch (e) {
      console.log(e);
    }
  }
}

export default forum;
