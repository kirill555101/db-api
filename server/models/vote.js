import db from '../db';

const vote = {
  async create(voice, threadId, nickname) {
    try {
      return await db.oneOrNone(
        `
          INSERT INTO votes (voice, thread, nickname)
          VALUES (
            $1, $2,
            (
              SELECT nickname
              FROM users
              WHERE nickname = $3
            )
          )
          ON CONFLICT ON CONSTRAINT votes_unique_nickname_thread DO
            UPDATE
            SET voice = $1
            WHERE votes.voice <> $1
            RETURNING *, (xmax::text::int > 0) as existed
        `,
        [voice, threadId, nickname]
      );
    } catch (e) {
      console.log(e);
    }
  }
}

export default vote;
