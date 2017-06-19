import nock from 'nock';
import path from 'path';
import fs from 'fs';
import os from 'os';
import download from '../src/page-loader';

describe('Test "download"', () => {
  const address = 'http://example.com';
  const body = 'hello!';
  const dir = os.tmpdir();
  beforeEach(() => {
    nock(address).get('/').reply(200, body);
  });
  it('Downloads page', (done) => {
    download(address, dir)
      .then(() => fs.readFile(path.resolve(dir, 'example-com.html'), 'utf8'))
      .then(data => expect(data).toBe(body))
      .then(done())
      .catch(done.fail);
  });
});
