import { startServer } from '../server';

export const setup = async () => {
  const server = await startServer();

  process.env.TEST_HOST = `http://127.0.0.1:${server.port}`;
};