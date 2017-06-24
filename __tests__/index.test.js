import nock from 'nock';
import path from 'path';
import fs from 'mz/fs';
import os from 'os';
import decode from 'unescape';
import download from '../src';

describe('Test downloading page', () => {
  const address = 'http://localhost/test';
  const body = `<html lang="en">
<body>
    <p>Weird text here</p>
    <img id="do not save me">
    <img src="./localhost-test_files/pictureoftheday.png">
    <script src="./localhost-test_files/windows11.js"></script>
    <link type="image/x-icon" href="./localhost-test_files/best_link_ever.ico">
    <script id="do not save me too"></script>
    <img id="img in subdir" src="./localhost-test_files/assets-trash.png">
</body>
</html>`;
  const testPageDir = path.resolve('./__tests__/__fixtures__/');
  const testPagePath = path.resolve(testPageDir, 'testPage.html');
  const testPageData = fs.readFileSync(testPagePath, 'utf-8');
  const testImgName = 'pictureoftheday.png';
  const testImgPath = path.resolve(testPageDir, testImgName);
  const testImgData = fs.readFileSync(testImgPath).data;
  const testScriptName = 'windows11.js';
  const testScriptPath = path.resolve(testPageDir, testScriptName);
  const testScriptData = fs.readFileSync(testScriptPath).data;
  const testLinkName = 'best_link_ever.ico';
  const testLinkPath = path.resolve(testPageDir, testLinkName);
  const testLinkData = fs.readFileSync(testLinkPath).data;
  const testDeepName = 'trash.png';
  const testDeepNewName = 'assets-trash.png';
  const testDeepPath = path.resolve(testPageDir, testDeepName);
  const testDeepData = fs.readFileSync(testDeepPath).data;
  const testTempDir = os.tmpdir();
  const testTempSubdir = path.resolve(testTempDir, 'subdir');
  const isListring = true;
  beforeAll(() => {
    fs.mkdir(testTempSubdir);
  });
  beforeEach(() => {
    nock('http://localhost')
      .get('/test')
      .reply(200, testPageData)
      .get(`/test/${testImgName}`)
      .reply(200, testImgData)
      .get(`/test/${testScriptName}`)
      .reply(200, testScriptData)
      .get(`/test/${testLinkName}`)
      .reply(200, testLinkData)
      .get(`/test/assets/${testDeepName}`)
      .reply(200, testDeepData)
      .get('/notexist')
      .reply(404, { statusCode: 404 });
  });
  it('# Should download page', (done) => {
    download(address, testTempDir)
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test.html'), 'utf8'))
      .then(data => expect(decode(data)).toBe(body))
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test_files', testImgName)))
      .then(data => expect(data.data).toBe(testImgData))
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test_files', testScriptName)))
      .then(data => expect(data.data).toBe(testScriptData))
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test_files', testLinkName)))
      .then(data => expect(data.data).toBe(testLinkData))
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test_files', testDeepNewName)))
      .then(data => expect(data.data).toBe(testDeepData))
      .then(done)
      .catch(done.fail);
  });
  it('# Should return EEXIST if try to save page to directory which already has it', (done) => {
    download(address, testTempDir)
      .then(done.fail)
      .catch((error) => {
        expect(error.code).toBe('EEXIST');
        done();
      });
  });
  it('# Should return ENOENT if try to save page to nonexisting directory', (done) => {
    download(address, '/nopedir')
      .then(done.fail)
      .catch((error) => {
        expect(error.code).toBe('ENOENT');
        done();
      });
  });
  it('# Should return ENOTFOUND if try to download from invalid address', (done) => {
    download('http://fgsfds.blabla', testTempDir)
      .then(done.fail)
      .catch((error) => {
        expect(error.code).toBe('ENOTFOUND');
        done();
      });
  });
  it('# Should return 404 if try to download from nonexisting Page', (done) => {
    download('http://localhost/notexist', testTempDir)
      .then(done.fail)
      .catch((error) => {
        expect(error.response.status).toBe(404);
        done();
      });
  });
  it('# Should work neatly with Listr enabled if all is good', (done) => {
    download(address, testTempSubdir, isListring)
      .then(done)
      .catch(done.fail);
  });
  it('# Should intercept an error with Listr enabled', (done) => {
    download('http://localhost/notexist', testTempDir)
      .then(done.fail)
      .catch(done);
  });
});
