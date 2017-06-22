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
const testPagePath = path.resolve(testPageDir, 'testPage.html');
const getPageData = () => fs.readFileSync(testPagePath, 'utf-8');
const testImgName = 'pictureoftheday.png';
const testImgPath = path.resolve(testPageDir, testImgName);
const getImgData = () => fs.readFileSync(testImgPath).data;
const testScriptName = 'windows11.js';
const testScriptPath = path.resolve(testPageDir, testScriptName);
const getScriptData = () => fs.readFileSync(testScriptPath).data;
const testLinkName = 'best_link_ever.ico';
const testLinkPath = path.resolve(testPageDir, testLinkName);
const getLinkData = () => fs.readFileSync(testLinkPath).data;
const testDeepName = 'trash.png';
const testDeepNewName = 'assets-trash.png';
const testDeepPath = path.resolve(testPageDir, testDeepName);
const getDeepData = () => fs.readFileSync(testDeepPath).data;
const getTempDir = () => os.tmpdir();

describe('Test downloading page', () => {
  beforeEach(() => {
    nock('http://localhost')
      .get('/test')
      .reply(200, getPageData())
      .get(`/test/${testImgName}`)
      .reply(200, getImgData())
      .get(`/test/${testScriptName}`)
      .reply(200, getScriptData())
      .get(`/test/${testLinkName}`)
      .reply(200, getLinkData())
      .get(`/test/assets/${testDeepName}`)
      .reply(200, getDeepData());
  });
  it('# Should download page', (done) => {
    const tempDir = getTempDir();
    download(address, tempDir)
      .then(() => fs.readFileSync(path.resolve(tempDir, 'localhost-test.html'), 'utf8'))
      .then(data => expect(decode(data)).toBe(body))
      .then(() => fs.readFileSync(path.resolve(tempDir, 'localhost-test_files', testImgName)))
      .then(data => expect(data.data).toBe(getImgData()))
      .then(() => fs.readFileSync(path.resolve(tempDir, 'localhost-test_files', testScriptName)))
      .then(data => expect(data.data).toBe(getScriptData()))
      .then(() => fs.readFileSync(path.resolve(tempDir, 'localhost-test_files', testLinkName)))
      .then(data => expect(data.data).toBe(getLinkData()))
      .then(() => fs.readFileSync(path.resolve(tempDir, 'localhost-test_files', testDeepNewName)))
      .then(data => expect(data.data).toBe(getDeepData()))
      .then(done)
      .catch(done.fail);
  });
});
