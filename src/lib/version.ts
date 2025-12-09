import packageJson from '../../package.json'

export interface VersionInfo {
  version: string
  name: string
  author: string
  homepage: string
  repository: string
  buildDate: string
  nodeEnv: string
}

export const versionInfo: VersionInfo = {
  version: packageJson.version,
  name: packageJson.name,
  author: packageJson.author?.name || 'leowinfy',
  homepage: packageJson.homepage || '',
  repository: packageJson.repository?.url || '',
  buildDate: new Date().toISOString(),
  nodeEnv: process.env.NODE_ENV || 'development'
}

// 获取版本信息字符串
export function getVersionString(): string {
  return `${versionInfo.name} v${versionInfo.version}`
}

// 获取完整的版本信息
export function getFullVersionInfo(): string {
  return `
${getVersionString()}
Author: ${versionInfo.author}
Environment: ${versionInfo.nodeEnv}
Build Date: ${versionInfo.buildDate}
Repository: ${versionInfo.repository}
Homepage: ${versionInfo.homepage}
`.trim()
}

// API响应用的版本信息
export function getApiVersionInfo() {
  return {
    name: versionInfo.name,
    version: versionInfo.version,
    author: versionInfo.author,
    environment: versionInfo.nodeEnv,
    buildDate: versionInfo.buildDate
  }
}