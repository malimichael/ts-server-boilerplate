import * as faker from 'faker';
import * as rp from 'request-promise';
import { Connection } from 'typeorm';

import { User } from '../../entity/User';
import { redis } from '../../services/redis';
import { createTestConn } from '../../test/createTestConn';
import { createConfirmEmailLink } from '../../util/createConfirmEmailLink';

const host = process.env.TEST_HOST as string;

describe('/confirm/:id', () => {
  let userId: string;
  let confirmation: { id: string; link: string };
  let conn: Connection;

  beforeEach(async () => {
    conn = await createTestConn();

    const user = await User.create({
      email: faker.internet.email(),
      password: faker.internet.password(10),
    }).save();

    userId = user.id;

    confirmation = await createConfirmEmailLink(host, userId, redis);
  });

  afterEach(async () => {
    await conn.close();
  });

  test('should respond with "ok" and confirm user on sending link request', async () => {
    // 1st request
    const res = await rp.get(confirmation.link);

    const user = await User.findOne({ where: { id: userId } });

    expect(res).toEqual('ok');
    expect(user!.confirmed).toBe(true);
  });

  test('should respond with "invalid" on sending link request twice', async () => {
    // 1st request
    await rp.get(confirmation.link);
    // 2nd request
    const res = await rp.get(confirmation.link);

    const value = await redis.get(confirmation.id);

    expect(res).toEqual('invalid');
    expect(value).toBeNull();
  });
});
