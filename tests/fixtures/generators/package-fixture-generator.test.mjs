import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PackageFixtureGenerator, SimpleZipBuilder } from './package-fixture-generator.mjs';

test('PackageFixtureGenerator Test Suite', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-theme-fixture-test-'));

  t.after(() => {
    // 清理临时测试文件
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('1. createValidPackage 生成合法的主题包', () => {
    const pkgPath = path.join(tmpDir, 'valid.codex-theme');
    const buf = PackageFixtureGenerator.createValidPackage(pkgPath, { id: 'custom-valid-id' });
    
    assert.ok(fs.existsSync(pkgPath), '文件应当被成功写入到磁盘');
    assert.ok(buf.length > 0, '生成的 Zip Buffer 长度大于 0');

    // 简单验证二进制包中包含关键文件标记
    const zipStr = buf.toString('latin1');
    assert.ok(zipStr.includes('manifest.json'), 'ZIP 中包含 manifest.json');
    assert.ok(zipStr.includes('theme.json'), 'ZIP 中包含 theme.json');
    assert.ok(zipStr.includes('custom-valid-id'), 'ZIP 中包含自定义清单 ID');
  });

  await t.test('2. createPathTraversalPackage 生成路径穿越恶性条目', () => {
    const pkgPath = path.join(tmpDir, 'traversal.codex-theme');
    const buf = PackageFixtureGenerator.createPathTraversalPackage(pkgPath);

    assert.ok(fs.existsSync(pkgPath));
    const zipStr = buf.toString('latin1');
    assert.ok(zipStr.includes('../../../tmp/evil-traversal.txt'), 'ZIP 文件中包含向上跨目录的路径穿越条目');
    assert.ok(zipStr.includes('..\\..\\tmp\\win-traversal.txt'), 'ZIP 文件中包含 Windows 格式路径穿越条目');
    assert.ok(zipStr.includes('/etc/passwd'), 'ZIP 文件中包含根路径绝对条目');
  });

  await t.test('3. createExecutableContentPackage 生成可执行脚本条目', () => {
    const pkgPath = path.join(tmpDir, 'executable.codex-theme');
    const buf = PackageFixtureGenerator.createExecutableContentPackage(pkgPath);

    assert.ok(fs.existsSync(pkgPath));
    const zipStr = buf.toString('latin1');
    assert.ok(zipStr.includes('scripts/post-install.sh'), 'ZIP 中包含 shell 脚本条目');
    assert.ok(zipStr.includes('run.command'), 'ZIP 中包含 macOS .command 条目');
    assert.ok(zipStr.includes('setup.ps1'), 'ZIP 中包含 PowerShell .ps1 条目');
    assert.ok(zipStr.includes('payload.exe'), 'ZIP 中包含可执行 .exe 条目');
  });

  await t.test('4. createSymlinkPackage 生成软链接条目', () => {
    const pkgPath = path.join(tmpDir, 'symlink.codex-theme');
    const buf = PackageFixtureGenerator.createSymlinkPackage(pkgPath);

    assert.ok(fs.existsSync(pkgPath));
    const zipStr = buf.toString('latin1');
    assert.ok(zipStr.includes('assets/symlink_to_passwd'), 'ZIP 中包含软链接文件名');
    assert.ok(zipStr.includes('/etc/passwd'), 'ZIP 中包含软链接指向目标');
  });

  await t.test('5. createOversizedPackage 生成大文件条目', () => {
    const pkgPath = path.join(tmpDir, 'oversized.codex-theme');
    // 生成一个测试用的 2MB 尺寸大包（避免单元测试运行过慢，功能验证完整）
    const buf = PackageFixtureGenerator.createOversizedPackage(pkgPath, 2 * 1024 * 1024);

    assert.ok(fs.existsSync(pkgPath));
    assert.ok(buf.length > 2 * 1024 * 1024, '包尺寸确实大于 2MB');
  });

  await t.test('6. createMissingManifestPackage 生成缺少 manifest 的残缺包', () => {
    const pkgPath = path.join(tmpDir, 'missing-manifest.codex-theme');
    const buf = PackageFixtureGenerator.createMissingManifestPackage(pkgPath);

    assert.ok(fs.existsSync(pkgPath));
    const zipStr = buf.toString('latin1');
    assert.ok(!zipStr.includes('manifest.json'), '包中不应当包含 manifest.json');
    assert.ok(zipStr.includes('theme.json'), '包中仍包含 theme.json');
  });

  await t.test('7. createUnsupportedSchemaPackage 生成 Schema 大版本号超出的包', () => {
    const pkgPath = path.join(tmpDir, 'unsupported-schema.codex-theme');
    const buf = PackageFixtureGenerator.createUnsupportedSchemaPackage(pkgPath);

    assert.ok(fs.existsSync(pkgPath));
    const zipStr = buf.toString('latin1');
    assert.ok(zipStr.includes('"schemaVersion": 9999'), '包含不受支持的远大版本号');
  });

  await t.test('8. createDuplicateIdPackage 生成包含冲突目标 ID 的包', () => {
    const pkgPath = path.join(tmpDir, 'duplicate.codex-theme');
    const targetId = 'target-conflict-theme-id';
    const buf = PackageFixtureGenerator.createDuplicateIdPackage(pkgPath, targetId);

    assert.ok(fs.existsSync(pkgPath));
    const zipStr = buf.toString('latin1');
    assert.ok(zipStr.includes(targetId), '包含指定碰撞的目标 ID');
  });
});
