import db, { pgp } from '../db';

const post = {
  async findById(id) {
    return await db.oneOrNone(
      `
        SELECT *
        FROM posts
        WHERE id = $1
      `,
      [id]
    );
  },

  async findByIdAndThreadId(id, threadId) {
    return await db.oneOrNone(
      `
        SELECT *
        FROM posts
        WHERE (id = $1) AND (thread = $2)
      `,
      [id, threadId]
    );
  },

  async create(columns, values) {
    let query = pgp.helpers.insert(values, columns, { table: 'posts' }, null, { emptyUpdate: 'conflict' })
    query += ' RETURNING *';
    return await db.oneOrNone(query);
  },

  async createByQuery(valuesInStringQuery) {
    try {
      return await db.manyOrNone(
        `
          INSERT INTO posts (author, "message", parent, created, thread, forum, id, pathtopost)
          VALUES ${valuesInStringQuery}
          RETURNING *
        `
      );
    } catch (e) {
      console.log(e);
    }
  },

  async update(message, id) {
    return await db.oneOrNone(
      `
        UPDATE posts
        SET "isEdited" = TRUE, "message" = $1
        WHERE id = $2
        RETURNING *
      `,
      [message, id]
    );
  },

  async getNextId() {
    return await db.one("SELECT nextval('seq_posts_id')");
  },

  async getPathtopost(id) {
    return await db.oneOrNone(
      `
        SELECT pathtopost
        FROM posts
        WHERE id = $1
      `,
      [id]
    );
  },

  async flatSort(slugOrId, isId, params) {
    try {
      const threadId = isId
        ? slugOrId
        :
          `
            (
              SELECT id
              FROM threads
              WHERE slug = '${slugOrId}'
            )
          `;

      if (params.since) {
        if (params.desc) {
          return await db.manyOrNone(
            `
              SELECT * FROM posts
              WHERE (thread = $1:raw) AND (id < $2)
              ORDER BY created DESC, id DESC
              LIMIT $3
            `,
            [
              threadId,
              params.since,
              params.limit
            ]
          );
        } else {
          return await db.manyOrNone(
            `
              SELECT *
              FROM posts
              WHERE (thread = $1:raw) AND (id > $2)
              ORDER BY created ASC, id ASC
              LIMIT $3
            `,
            [
              threadId,
              params.since,
              params.limit
            ]
          );
        }
      } else {
          if (params.desc) {
            return await db.manyOrNone(
              `
                SELECT * FROM posts
                WHERE thread = $1:raw
                ORDER BY created DESC, id DESC
                LIMIT $3
              `,
              [
                threadId,
                params.since,
                params.limit
              ]
            );
          } else {
            return await db.manyOrNone(
              `
                SELECT * FROM posts
                WHERE thread = $1:raw
                ORDER BY created ASC, id ASC
                LIMIT $3
              `,
              [
                threadId,
                params.since,
                params.limit
              ]);
          }
      }
    } catch (e) {
      console.log(e);
    }
  },

  async treeSort(slugOrId, isId, params) {
    try {
      const threadId = isId
        ? slugOrId
        : `
            (
              SELECT id
              FROM threads
              WHERE slug = '${slugOrId}'
            )
          `;
      const pathSortRule = params.desc
        ? 'pathtopost DESC'
        : 'pathtopost ASC';

      if (params.since) {
        if (params.desc) {
          return await db.manyOrNone(
            `
              SELECT * FROM posts
              WHERE (thread = $1:raw) AND
                (pathtopost <
                  (
                    SELECT pathtopost
                    FROM posts
                    WHERE id = $2
                  )
                )
              ORDER BY $3:raw
              LIMIT $4
            `,
            [
              threadId,
              params.since,
              pathSortRule,
              params.limit
            ]
          );
        } else {
          return await db.manyOrNone(
            `
              SELECT * FROM posts
              WHERE (thread=$1:raw) AND
                (pathtopost >
                  (
                    SELECT pathtopost
                    FROM posts
                    WHERE id = $2
                  )
                )
              ORDER BY $3:raw
              LIMIT $4
            `,
            [
              threadId,
              params.since,
              pathSortRule,
              params.limit
            ]
          );
        }
      } else {
        return await db.manyOrNone(
          `
            SELECT * FROM posts
            WHERE thread=$1:raw
            ORDER BY $2:raw LIMIT $3
          `,
          [
            threadId,
            pathSortRule,
            params.limit
          ]
        );
      }
    } catch (e) {
      console.log(e);
    }
  },

  async parentTreeSort(slugOrId, isId, params) {
    try {
      const threadId = isId
        ? slugOrId
        :
          `
            (
              SELECT id
              FROM threads
              WHERE slug = '${slugOrId}'
            )
          `;
      const pathSortRule = params.desc
        ? 'pid.parent_id DESC, pathtopost ASC'
        : 'pathtopost ASC';
      const idSortRule = params.desc
        ? 'id DESC'
        : 'id ASC';

      if (params.since) {
        if (params.desc) {
          return db.manyOrNone(
            `
              SELECT * FROM posts
              JOIN (
                  SELECT id AS parent_id
                  FROM posts
                  WHERE (parent IS NULL) AND (thread = $1:raw)
                    AND (pathtopost[1] <
                      (
                        SELECT pathtopost[1]
                        FROM posts
                        WHERE id = $2
                      )
                    )
                  ORDER BY $3:raw LIMIT $4
              ) AS pid
              ON (thread=$1:raw) AND (pid.parent_id = pathtopost[1])
              ORDER BY $5:raw
            `,
            [
              threadId,
              params.since,
              idSortRule,
              params.limit,
              pathSortRule
            ]
          );
        } else {
          return db.manyOrNone(
            `
              SELECT * FROM posts
              JOIN (
                SELECT id AS parent_id
                FROM posts
                WHERE (parent IS NULL) AND (thread = $1:raw) AND
                  (pathtopost[1] >
                    (
                      SELECT pathtopost[1]
                      FROM posts
                      WHERE id = $2
                    )
                  )
                ORDER BY $3:raw
                LIMIT $4
              ) AS pid
              ON (thread = $1:raw) AND (pid.parent_id = pathtopost[1])
              ORDER BY $5:raw
            `,
            [
              threadId,
              params.since,
              idSortRule,
              params.limit,
              pathSortRule
            ]
          );
        }
      } else {
        return db.manyOrNone(
            `
              SELECT * FROM posts
              JOIN (
                SELECT id AS parent_id
                FROM posts
                WHERE (parent IS NULL) AND (thread = $1:raw)
                ORDER BY $3:raw
                LIMIT $4
              ) AS pid
              ON (thread = $1:raw) AND (pid.parent_id = pathtopost[1])
              ORDER BY $5:raw
            `,
            [
              threadId,
              params.since,
              idSortRule,
              params.limit,
              pathSortRule
            ]
        );
      }
    } catch (e) {
      console.log(e);
    }
  }
}

export default post;
