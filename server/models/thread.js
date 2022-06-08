import db, { pgp } from '../db';

const thread = {
  async findBySlug(slug) {
    return await db.oneOrNone(
      `
        SELECT *
        FROM threads
        WHERE slug = $1
      `,
      [slug]
    );
  },

  async findById(id) {
    return await db.oneOrNone(
      `
        SELECT *
        FROM threads
        WHERE id = $1
      `,
      [id]
    );
  },

  async incrementVotesBySlug(slug, voice) {
    return await db.one(
      `
        UPDATE threads
        SET votes = votes + $2
        WHERE slug = $1
        RETURNING *
      `,
      [slug, voice]
    );
  },

  async incrementVotesById(id, voice) {
    return await db.one(
      `
        UPDATE threads
        SET votes = votes + $2
        WHERE id = $1
        RETURNING * `,
      [id, voice]
    );
  },

  async update(slug, columns, values) {
    let query = pgp.helpers.update(values, columns, { table: 'threads' }, null, { emptyUpdate: 'conflict' });
    query += ` WHERE slug = '${slug}' RETURNING *`;
    return await db.oneOrNone(query);
  },

  async findAllBySlug(slug, params) {
    try {
      params.desc = params.desc === 'true';

      if (params.since) {
        if (params.desc) {
          return await db.manyOrNone(
            `
              SELECT *
              FROM threads
              WHERE (forum = $1) AND (created <= $2)
              ORDER BY $3:raw
              LIMIT $4
            `,
            [
              slug,
              params.since,
              (params.desc ? 'created DESC' : 'created ASC'),
              params.limit
            ]
          );
        } else {
          return await db.manyOrNone(
            `
              SELECT *
              FROM threads
              WHERE (forum = $1) AND (created >= $2)
              ORDER BY $3:raw
              LIMIT $4
            `,
            [
              slug,
              params.since,
              (params.desc ? 'created DESC' : 'created ASC'),
              params.limit
            ]
          );
        }
      } else {
        return await db.manyOrNone(
          `
            SELECT *
            FROM threads
            WHERE forum = $1
            ORDER BY $2:raw
            LIMIT $3
          `,
          [
            slug,
            (params.desc ? 'created DESC' : 'created ASC'),
            params.limit
          ]
        );
      }
    } catch (e) {
      console.log(e);
    }
  },

  async create(columns, values) {
    const c = '(' + columns.join(', ') + ')';
    const v = '(' + values.map((_, i) => '$' + (i + 1).toString()).join(', ') + ')';

    try {
      const query = 'INSERT INTO threads ' + c + ' VALUES ' + v + ` ON CONFLICT DO NOTHING RETURNING *`;
      return await db.oneOrNone(query, values);
    } catch (e) {
      console.log(e);
    }
  }
}

export default thread;
