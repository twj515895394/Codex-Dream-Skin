import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { PackageFixtureGenerator, SimpleZipBuilder } from '../../tests/fixtures/generators/package-fixture-generator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMPORT_SCRIPT = path.resolve(__dirname, '../scripts/import-theme-macos.sh');

/**
 * 辅助函数：在一个独立的 STATE_ROOT 中运行 import-theme-macos.sh
 * @param {string[]} args 
 * @param {string} stateRoot 
 */
function runImporter(args, stateRoot) {
  const env = {
    ...process.env,
    STATE_ROOT: stateRoot,
    NODE: process.execPath,
  };

  return spawnSync(IMPORT_SCRIPT, args, {
    env,
    encoding: 'utf-8',
  });
}

test('macOS Importer Regression Test Suite (15+ Scenarios)', async (t) => {
  let tmpStateRoot;
  let tmpPackageDir;

  t.beforeEach(() => {
    tmpStateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-importer-test-state-'));
    tmpPackageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-importer-test-pkg-'));
  });

  t.afterEach(() => {
    if (fs.existsSync(tmpStateRoot)) fs.rmSync(tmpStateRoot, { recursive: true, force: true });
    if (fs.existsSync(tmpPackageDir)) fs.rmSync(tmpPackageDir, { recursive: true, force: true });
  });

  await t.test('1. 正常包导入：合法 ZIP 在 --no-apply 模式下成功写入库', () => {
    const pkgPath = path.join(tmpPackageDir, 'valid-theme.codex-theme');
    PackageFixtureGenerator.createValidPackage(pkgPath, { id: 'valid-theme-01' });

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.strictEqual(result.status, 0, `导入应当成功，stderr: ${result.stderr}`);

    const targetThemeDir = path.join(tmpStateRoot, 'themes', 'valid-theme-01');
    assert.ok(fs.existsSync(targetThemeDir), '主题应该被导入到 STATE_ROOT/themes/valid-theme-01');
    assert.ok(fs.existsSync(path.join(targetThemeDir, 'manifest.json')), '导入目录包含 manifest.json');
    assert.ok(fs.existsSync(path.join(targetThemeDir, 'theme.json')), '导入目录包含 theme.json');
  });

  await t.test('2. --no-apply 标记：导入后库更新但 active theme 不改变', () => {
    const pkgPath = path.join(tmpPackageDir, 'no-apply.codex-theme');
    PackageFixtureGenerator.createValidPackage(pkgPath, { id: 'no-apply-theme' });

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.strictEqual(result.status, 0);

    const activeThemePath = path.join(tmpStateRoot, 'theme');
    assert.ok(!fs.existsSync(activeThemePath), '在 --no-apply 下不发布/不应用 active theme');
  });

  await t.test('3. 路径穿越预检：POSIX ../ 条目被拦截', () => {
    const pkgPath = path.join(tmpPackageDir, 'traversal.codex-theme');
    PackageFixtureGenerator.createPathTraversalPackage(pkgPath);

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0, '应该被拦截，退出码非零');
    assert.match(result.stderr, /unsafe path/i, '错误原因提示包含 unsafe path');
  });

  await t.test('4. 路径穿越预检：Windows ..\\ 条目被拦截', () => {
    const builder = new SimpleZipBuilder();
    builder.addFile('manifest.json', JSON.stringify(PackageFixtureGenerator.getDefaultManifest()));
    builder.addFile('theme.json', JSON.stringify(PackageFixtureGenerator.getDefaultThemeConfig()));
    builder.addFile('background.jpg', PackageFixtureGenerator.getValid1x1PngBuffer());
    builder.addFile('..\\evil.txt', 'evil content');
    const pkgPath = path.join(tmpPackageDir, 'win-traversal.codex-theme');
    fs.writeFileSync(pkgPath, builder.build());

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /unsafe path/i);
  });

  await t.test('5. 路径穿越预检：绝对路径 /etc/passwd 被拦截', () => {
    const builder = new SimpleZipBuilder();
    builder.addFile('manifest.json', JSON.stringify(PackageFixtureGenerator.getDefaultManifest()));
    builder.addFile('theme.json', JSON.stringify(PackageFixtureGenerator.getDefaultThemeConfig()));
    builder.addFile('background.jpg', PackageFixtureGenerator.getValid1x1PngBuffer());
    builder.addFile('/etc/passwd', 'root:x:0:0');
    const pkgPath = path.join(tmpPackageDir, 'abs-path.codex-theme');
    fs.writeFileSync(pkgPath, builder.build());

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /unsafe path/i);
  });

  await t.test('6. 可执行内容拦截：包含 .sh 脚本的包被拦截', () => {
    const pkgPath = path.join(tmpPackageDir, 'sh-script.codex-theme');
    PackageFixtureGenerator.createExecutableContentPackage(pkgPath);

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /executable content is not allowed/i);
  });

  await t.test('7. 可执行内容拦截：包含 .exe / .ps1 扩展名的包被拦截', () => {
    const builder = new SimpleZipBuilder();
    builder.addFile('manifest.json', JSON.stringify(PackageFixtureGenerator.getDefaultManifest()));
    builder.addFile('theme.json', JSON.stringify(PackageFixtureGenerator.getDefaultThemeConfig()));
    builder.addFile('background.jpg', PackageFixtureGenerator.getValid1x1PngBuffer());
    builder.addFile('evil.ps1', 'Write-Host "evil"');
    const pkgPath = path.join(tmpPackageDir, 'ps1-script.codex-theme');
    fs.writeFileSync(pkgPath, builder.build());

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /executable content is not allowed/i);
  });

  await t.test('8. 软链接（Symlink）拦截：ZIP 包含符号链接被解压检测拦截', () => {
    const pkgPath = path.join(tmpPackageDir, 'symlink.codex-theme');
    PackageFixtureGenerator.createSymlinkPackage(pkgPath);

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /symbolic links/i);
  });

  await t.test('9. 超大包拦截：超出 64MB 限制的包被拦截', () => {
    const builder = new SimpleZipBuilder();
    builder.addFile('manifest.json', JSON.stringify(PackageFixtureGenerator.getDefaultManifest()));
    builder.addFile('theme.json', JSON.stringify(PackageFixtureGenerator.getDefaultThemeConfig()));
    // 欺骗声明或添加超过大小限额
    const pkgPath = path.join(tmpPackageDir, 'oversized.codex-theme');
    PackageFixtureGenerator.createOversizedPackage(pkgPath, 65 * 1024 * 1024);

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /64 MB/i);
  });

  await t.test('10. 缺失 manifest.json 的残缺包被拦截', () => {
    const pkgPath = path.join(tmpPackageDir, 'no-manifest.codex-theme');
    PackageFixtureGenerator.createMissingManifestPackage(pkgPath);

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /manifest\.json is missing/i);
  });

  await t.test('11. 缺失 theme.json 的残缺包被拦截', () => {
    const builder = new SimpleZipBuilder();
    builder.addFile('manifest.json', JSON.stringify(PackageFixtureGenerator.getDefaultManifest()));
    const pkgPath = path.join(tmpPackageDir, 'no-theme.codex-theme');
    fs.writeFileSync(pkgPath, builder.build());

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /theme\.json is missing/i);
  });

  await t.test('12. 不支持的 Schema 版本被拦截', () => {
    const pkgPath = path.join(tmpPackageDir, 'unsupported-schema.codex-theme');
    PackageFixtureGenerator.createUnsupportedSchemaPackage(pkgPath);

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /Unsupported manifest schemaVersion/i);
  });

  await t.test('13. manifest.id 与 theme.id 不一致被拦截', () => {
    const pkgPath = path.join(tmpPackageDir, 'mismatch-id.codex-theme');
    PackageFixtureGenerator.createValidPackage(
      pkgPath,
      { id: 'manifest-id-1' },
      { id: 'theme-id-2' }
    );

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /theme\.id must match manifest\.id/i);
  });

  await t.test('14. 非 .codex-theme 后缀文件被拦截', () => {
    const pkgPath = path.join(tmpPackageDir, 'invalid-extension.zip');
    PackageFixtureGenerator.createValidPackage(pkgPath);

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /\.codex-theme extension/i);
  });

  await t.test('15. 非法控制字符/异常格式 ID 防护拦截', () => {
    const pkgPath = path.join(tmpPackageDir, 'invalid-id.codex-theme');
    PackageFixtureGenerator.createValidPackage(pkgPath, { id: 'invalid id with spaces!' });

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);
    assert.match(result.stderr, /Invalid manifest id/i);
  });

  await t.test('16. 失败恢复验证：导入失败后库目录干净无任何残留污染', () => {
    const pkgPath = path.join(tmpPackageDir, 'failed-import.codex-theme');
    PackageFixtureGenerator.createExecutableContentPackage(pkgPath);

    const result = runImporter(['--file', pkgPath, '--no-apply'], tmpStateRoot);
    assert.notStrictEqual(result.status, 0);

    // 检查 STATE_ROOT/themes 下没有任何新安装的主题或临时解压文件
    const themesDir = path.join(tmpStateRoot, 'themes');
    if (fs.existsSync(themesDir)) {
      const entries = fs.readdirSync(themesDir);
      assert.strictEqual(entries.length, 0, '失败的导入不应该在 themes 目录下留下任何文件夹');
    }
  });

  await t.test('17. 重复同 ID 主题覆盖导入：新版本成功覆盖并替换库中的主题', () => {
    const pkgPath1 = path.join(tmpPackageDir, 'v1.codex-theme');
    const pkgPath2 = path.join(tmpPackageDir, 'v2.codex-theme');
    
    PackageFixtureGenerator.createValidPackage(pkgPath1, { id: 'repeat-id', name: 'Version 1' });
    PackageFixtureGenerator.createValidPackage(pkgPath2, { id: 'repeat-id', name: 'Version 2' });

    // 第一次导入 v1
    const res1 = runImporter(['--file', pkgPath1, '--no-apply'], tmpStateRoot);
    assert.strictEqual(res1.status, 0);

    // 第二次导入 v2 覆盖
    const res2 = runImporter(['--file', pkgPath2, '--no-apply'], tmpStateRoot);
    assert.strictEqual(res2.status, 0);

    const manifestContent = fs.readFileSync(path.join(tmpStateRoot, 'themes', 'repeat-id', 'manifest.json'), 'utf-8');
    assert.ok(manifestContent.includes('Version 2'), '重复导入时成功更新为新版本内容');
  });
});
