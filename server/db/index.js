import pgPromise from 'pg-promise';

export const pgp = pgPromise();

const config = {
  host: 'localhost',
  port: 5432,
  database: 'api',
  user: 'api',
  password: 'password'
};

export default pgp(config);
