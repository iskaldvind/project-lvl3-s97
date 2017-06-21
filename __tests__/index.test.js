import nock from 'nock';
import path from 'path';
import fs from 'mz/fs';
import os from 'os';
import decode from 'unescape';
import download from '../src';

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
const testPageData = fs.readFileSync(path.resolve(testPageDir, 'testPage.html'), 'utf-8');
const testImgName = 'pictureoftheday.png';
const testImgData = fs.readFileSync(path.resolve(testPageDir, testImgName));
const testScriptName = 'windows11.js';
const testScriptData = fs.readFileSync(path.resolve(testPageDir, testScriptName));
const testLinkName = 'best_link_ever.ico';
const testLinkData = fs.readFileSync(path.resolve(testPageDir, testLinkName));
const testDeepName = 'trash.png';
const testDeepNewName = 'assets-trash.png';
const testDeepData = fs.readFileSync(path.resolve(testPageDir, testDeepName));
const testTempDir = os.tmpdir();

describe('Test downloading page', () => {
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
      .reply(200, testDeepData);
  });
  it('# Should download page', (done) => {
    download(address, testTempDir)
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test.html'), 'utf8'))
      .then(data => expect(decode(data)).toBe(body))
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test_files', testImgName)))
      .then(data => expect(data.data).toBe(testImgData.data))
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test_files', testScriptName)))
      .then(data => expect(data.data).toBe(testScriptData.data))
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test_files', testLinkName)))
      .then(data => expect(data.data).toBe(testLinkData.data))
      .then(() => fs.readFileSync(path.resolve(testTempDir, 'localhost-test_files', testDeepNewName)))
      .then(data => expect(data.data).toBe(testDeepData.data))
      .then(done)
      .catch(done.fail);
  });
});
