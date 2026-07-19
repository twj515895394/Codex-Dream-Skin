import fs from 'fs';
import path from 'path';

/**
 * 计算 Buffer 的 CRC32 校验码
 * @param {Buffer} buf 
 * @returns {number}
 */
function calculateCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * 零外部依赖的纯 JavaScript ZIP 文件构造器
 * 支持包含路径穿越、Symlink、特定文件权限和文件内容
 */
export class SimpleZipBuilder {
  constructor() {
    this.entries = [];
  }

  /**
   * 添加一个文件/条目到 ZIP 包中
   * @param {string} fileName 文件名 (可以是含 path traversal 的路径，如 ../evil.txt)
   * @param {Buffer|string} content 内容
   * @param {Object} options
   * @param {number} [options.mode] 文件权限/属性标志，如 0o120777 表示 Symlink
   * @param {number} [options.uncompressedSize] 覆盖解压大小声明（测试欺骗攻击）
   */
  addFile(fileName, content, options = {}) {
    const dataBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    const crc = calculateCrc32(dataBuffer);
    
    this.entries.push({
      fileName,
      data: dataBuffer,
      crc,
      mode: options.mode || 0o100644,
      uncompressedSize: options.uncompressedSize !== undefined ? options.uncompressedSize : dataBuffer.length,
      compressedSize: dataBuffer.length,
    });
  }

  /**
   * 构建并返回 ZIP 文件的二进制 Buffer
   * @returns {Buffer}
   */
  build() {
    const localHeaders = [];
    const cdHeaders = [];
    let currentOffset = 0;

    for (const entry of this.entries) {
      const fileNameBuffer = Buffer.from(entry.fileName, 'utf-8');
      
      // Local File Header (30 字节 + fileName.length + data.length)
      const localHeader = Buffer.alloc(30 + fileNameBuffer.length);
      localHeader.writeUInt32LE(0x04034b50, 0); // Signature
      localHeader.writeUInt16LE(20, 4);         // Version needed (2.0)
      localHeader.writeUInt16LE(0, 6);          // Flags
      localHeader.writeUInt16LE(0, 8);          // Compression method (0 = Store)
      localHeader.writeUInt16LE(0, 10);         // Last mod time
      localHeader.writeUInt16LE(0, 12);         // Last mod date
      localHeader.writeUInt32LE(entry.crc, 14); // CRC-32
      localHeader.writeUInt32LE(entry.compressedSize, 18);
      localHeader.writeUInt32LE(entry.uncompressedSize, 22);
      localHeader.writeUInt16LE(fileNameBuffer.length, 26);
      localHeader.writeUInt16LE(0, 28);         // Extra field length
      fileNameBuffer.copy(localHeader, 30);

      localHeaders.push(localHeader);
      localHeaders.push(entry.data);

      // External File Attributes: 将 POSIX mode 存入高 16 位
      const externalAttr = ((entry.mode & 0xffff) << 16) >>> 0;

      // Central Directory Header (46 字节 + fileName.length)
      const cdHeader = Buffer.alloc(46 + fileNameBuffer.length);
      cdHeader.writeUInt32LE(0x02014b50, 0);   // Signature
      cdHeader.writeUInt16LE(0x0314, 4);       // Made by (Unix, v2.0)
      cdHeader.writeUInt16LE(20, 6);           // Version needed
      cdHeader.writeUInt16LE(0, 8);            // Flags
      cdHeader.writeUInt16LE(0, 10);           // Compression method
      cdHeader.writeUInt16LE(0, 12);           // Last mod time
      cdHeader.writeUInt16LE(0, 14);           // Last mod date
      cdHeader.writeUInt32LE(entry.crc, 16);   // CRC-32
      cdHeader.writeUInt32LE(entry.compressedSize, 20);
      cdHeader.writeUInt32LE(entry.uncompressedSize, 24);
      cdHeader.writeUInt16LE(fileNameBuffer.length, 28);
      cdHeader.writeUInt16LE(0, 30);           // Extra field length
      cdHeader.writeUInt16LE(0, 32);           // Comment length
      cdHeader.writeUInt16LE(0, 34);           // Disk number start
      cdHeader.writeUInt16LE(0, 36);           // Internal attributes
      cdHeader.writeUInt32LE(externalAttr, 38);// External attributes
      cdHeader.writeUInt32LE(currentOffset, 42);// Relative offset of local header
      fileNameBuffer.copy(cdHeader, 46);

      cdHeaders.push(cdHeader);

      currentOffset += localHeader.length + entry.data.length;
    }

    const cdStartOffset = currentOffset;
    let cdSize = 0;
    for (const cd of cdHeaders) {
      cdSize += cd.length;
    }

    // End of Central Directory Record (EOCD, 22 字节)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);        // Signature
    eocd.writeUInt16LE(0, 4);                 // Disk number
    eocd.writeUInt16LE(0, 6);                 // Start disk
    eocd.writeUInt16LE(this.entries.length, 8); // Entries on disk
    eocd.writeUInt16LE(this.entries.length, 10);// Total entries
    eocd.writeUInt32LE(cdSize, 12);           // Central directory size
    eocd.writeUInt32LE(cdStartOffset, 16);    // Start offset of central directory
    eocd.writeUInt16LE(0, 20);                // Comment length

    return Buffer.concat([...localHeaders, ...cdHeaders, eocd]);
  }
}

/**
 * Package Fixture Generator 主生成器类
 */
export class PackageFixtureGenerator {
  /**
   * 建立默认合法的主题清单元数据
   */
  static getDefaultManifest(overrides = {}) {
    return {
      manifestVersion: 1,
      id: "fixture-test-theme",
      name: "Fixture Test Theme",
      version: "1.0.0",
      author: "Test Suite",
      description: "A valid fixture theme for testing",
      schemaVersion: 1,
      ...overrides,
    };
  }

  /**
   * 建立默认合法的主题配置定义
   */
  static getDefaultThemeConfig(overrides = {}) {
    return {
      name: "Fixture Test Theme",
      appearance: "dark",
      colors: {
        background: "#1e1e2e",
        foreground: "#cdd6f4",
        accent: "#89b4fa"
      },
      ...overrides,
    };
  }

  /**
   * 生成一像素的透明 PNG 图片 Buffer (极小合法 PNG)
   */
  static getValid1x1PngBuffer() {
    return Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG Signature
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82
    ]);
  }

  /**
   * 1. 正常包：合法 manifest/theme.json 和有效图片
   */
  static createValidPackage(outputPath, manifestOverrides = {}, themeOverrides = {}) {
    const builder = new SimpleZipBuilder();
    const manifest = this.getDefaultManifest(manifestOverrides);
    const theme = this.getDefaultThemeConfig(themeOverrides);

    builder.addFile('manifest.json', JSON.stringify(manifest, null, 2));
    builder.addFile('theme.json', JSON.stringify(theme, null, 2));
    builder.addFile('preview.png', this.getValid1x1PngBuffer());
    builder.addFile('assets/wallpaper.jpg', Buffer.from('fake-image-content'));

    const zipBuffer = builder.build();
    this._ensureDirAndWrite(outputPath, zipBuffer);
    return zipBuffer;
  }

  /**
   * 2. 路径穿越包：包含 ../、绝对路径或混合路径等恶意条目
   */
  static createPathTraversalPackage(outputPath) {
    const builder = new SimpleZipBuilder();
    const manifest = this.getDefaultManifest({ id: "path-traversal-theme" });
    
    builder.addFile('manifest.json', JSON.stringify(manifest, null, 2));
    builder.addFile('theme.json', JSON.stringify(this.getDefaultThemeConfig(), null, 2));
    // 恶意跨目录条目
    builder.addFile('../../../tmp/evil-traversal.txt', 'pwned by traversal');
    builder.addFile('..\\..\\tmp\\win-traversal.txt', 'pwned by win traversal');
    builder.addFile('/etc/passwd', 'root:x:0:0:root:/root:/bin/bash');

    const zipBuffer = builder.build();
    this._ensureDirAndWrite(outputPath, zipBuffer);
    return zipBuffer;
  }

  /**
   * 3. 可执行内容包：包含 .sh、.command、.ps1 或二进制可执行脚本
   */
  static createExecutableContentPackage(outputPath) {
    const builder = new SimpleZipBuilder();
    const manifest = this.getDefaultManifest({ id: "executable-content-theme" });

    builder.addFile('manifest.json', JSON.stringify(manifest, null, 2));
    builder.addFile('theme.json', JSON.stringify(this.getDefaultThemeConfig(), null, 2));
    // 恶意可执行脚本条目 (带可执行权限 0o100755)
    builder.addFile('scripts/post-install.sh', '#!/bin/sh\necho pwned', { mode: 0o100755 });
    builder.addFile('run.command', '#!/bin/bash\necho pwned', { mode: 0o100755 });
    builder.addFile('setup.ps1', 'Write-Host "pwned"');
    builder.addFile('payload.exe', Buffer.from([0x4d, 0x5a, 0x90, 0x00])); // MZ PE header

    const zipBuffer = builder.build();
    this._ensureDirAndWrite(outputPath, zipBuffer);
    return zipBuffer;
  }

  /**
   * 4. Symlink 软链接包：包含指向系统文件或外部目录的符号链接
   */
  static createSymlinkPackage(outputPath) {
    const builder = new SimpleZipBuilder();
    const manifest = this.getDefaultManifest({ id: "symlink-theme" });

    builder.addFile('manifest.json', JSON.stringify(manifest, null, 2));
    builder.addFile('theme.json', JSON.stringify(this.getDefaultThemeConfig(), null, 2));
    // POSIX Symlink mode 0o120777, 内容为指向的硬路径
    builder.addFile('assets/symlink_to_passwd', '/etc/passwd', { mode: 0o120777 });
    builder.addFile('assets/symlink_to_parent', '../', { mode: 0o120777 });

    const zipBuffer = builder.build();
    this._ensureDirAndWrite(outputPath, zipBuffer);
    return zipBuffer;
  }

  /**
   * 5. 超大包：包含声明或实际尺寸超过安全限制的大文件
   * @param {string} outputPath 
   * @param {number} sizeBytes 模拟的大文件尺寸 (默认 51MB)
   */
  static createOversizedPackage(outputPath, sizeBytes = 51 * 1024 * 1024) {
    const builder = new SimpleZipBuilder();
    const manifest = this.getDefaultManifest({ id: "oversized-theme" });

    builder.addFile('manifest.json', JSON.stringify(manifest, null, 2));
    builder.addFile('theme.json', JSON.stringify(this.getDefaultThemeConfig(), null, 2));
    
    // 生成一个带有大数据的条目
    const dummyChunk = Buffer.alloc(1024 * 1024, 'A'); // 1MB 填充
    const chunks = [];
    const targetMegs = Math.ceil(sizeBytes / (1024 * 1024));
    for (let i = 0; i < targetMegs; i++) {
      chunks.push(dummyChunk);
    }
    builder.addFile('assets/huge-file.bin', Buffer.concat(chunks));

    const zipBuffer = builder.build();
    this._ensureDirAndWrite(outputPath, zipBuffer);
    return zipBuffer;
  }

  /**
   * 6. 缺件包：缺少 manifest.json 或 theme.json 的残缺包
   */
  static createMissingManifestPackage(outputPath) {
    const builder = new SimpleZipBuilder();
    // 只有 theme.json，缺少 manifest.json
    builder.addFile('theme.json', JSON.stringify(this.getDefaultThemeConfig(), null, 2));
    builder.addFile('preview.png', this.getValid1x1PngBuffer());

    const zipBuffer = builder.build();
    this._ensureDirAndWrite(outputPath, zipBuffer);
    return zipBuffer;
  }

  /**
   * 7. Schema 不支持包：schemaVersion / manifestVersion 版本不受支持
   */
  static createUnsupportedSchemaPackage(outputPath) {
    const builder = new SimpleZipBuilder();
    const manifest = this.getDefaultManifest({
      id: "unsupported-schema-theme",
      schemaVersion: 9999, // 未来不支持的大版本号
      manifestVersion: 9999
    });

    builder.addFile('manifest.json', JSON.stringify(manifest, null, 2));
    builder.addFile('theme.json', JSON.stringify(this.getDefaultThemeConfig(), null, 2));

    const zipBuffer = builder.build();
    this._ensureDirAndWrite(outputPath, zipBuffer);
    return zipBuffer;
  }

  /**
   * 8. ID 冲突包：指定 ID 生成的包，用于测试覆盖与重名冲突
   */
  static createDuplicateIdPackage(outputPath, targetThemeId = "conflict-target-id") {
    return this.createValidPackage(outputPath, { id: targetThemeId, name: `Duplicate Theme (${targetThemeId})` });
  }

  /**
   * 内部辅助：确保父目录存在并写入二进制数据
   */
  static _ensureDirAndWrite(filePath, buffer) {
    if (!filePath) return;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, buffer);
  }
}
