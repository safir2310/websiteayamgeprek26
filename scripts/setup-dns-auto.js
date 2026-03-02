#!/usr/bin/env node

/**
 * Script Otomatisasi: Tambah DNS Records dari Resend ke Vercel
 *
 * Penggunaan:
 * 1. Buat Vercel API Token: https://vercel.com/account/tokens
 * 2. Set environment variable: VERCEL_API_TOKEN di .env
 * 3. Set environment variable: DOMAIN_NAME di .env
 * 4. Jalankan script: bun run scripts/setup-dns-auto.js
 *
 * Script ini akan:
 * - Mengambil DNS records dari Resend untuk domain yang ditentukan
 * - Menambahkan DNS records tersebut ke Vercel secara otomatis
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Color codes untuk terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

// Baca environment variables dari .env
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    const envVars = {}

    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=').trim()
      if (key && !key.startsWith('#') && value) {
        envVars[key.trim()] = value
      }
    })

    return envVars
  } catch (err) {
    error('Gagal membaca file .env')
    return {}
  }
}

// Validasi environment variables
function validateConfig(env) {
  const required = ['RESEND_API_KEY', 'VERCEL_API_TOKEN', 'DOMAIN_NAME']
  const missing = required.filter(key => !env[key])

  if (missing.length > 0) {
    error('Environment variables berikut belum diset:')
    missing.forEach(key => {
      error(`  - ${key}`)
    })
    return false
  }

  return true
}

// Helper: Buat request ke API
async function fetchAPI(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error (${response.status}): ${errorText}`)
  }

  return response.json()
}

// Step 1: Ambil DNS records dari Resend
async function getResendDNSRecords(domain, resendApiKey) {
  info('Mengambil DNS records dari Resend...')

  try {
    // Cek domain yang sudah ada di Resend
    const domainsResponse = await fetchAPI('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
      },
    })

    // Cari domain yang cocok
    const domainData = domainsResponse.data.find(d => d.name === domain || d.name.replace('www.', '') === domain.replace('www.', ''))

    if (!domainData) {
      error(`Domain "${domain}" tidak ditemukan di Resend`)
      info(`Silakan tambahkan domain terlebih dahulu di: https://resend.com/domains/add`)
      return null
    }

    success(`Domain ditemukan: ${domainData.name}`)
    info(`Status: ${domainData.status}`)

    // Ambil DNS records dari response
    const dnsRecords = []

    // DNS records biasanya ada di response
    if (domainData.dns) {
      dnsRecords.push(...domainData.dns)
    }

    // Jika tidak ada di response, kita perlu generate berdasarkan standar Resend
    if (dnsRecords.length === 0) {
      warning('DNS records tidak ditemukan di response Resend')
      info('Menggunakan format standar Resend...')

      dnsRecords.push(
        {
          type: 'TXT',
          name: '@',
          value: `resend Verification Token: ${domainData.verificationToken || 'TOKEN_NOT_FOUND'}`,
        },
        {
          type: 'TXT',
          name: '_resend',
          value: 'v=spf1 include:_spf.resend.com ~all',
        },
        {
          type: 'CNAME',
          name: 'resend',
          value: 'resend._domainkey.resend.com',
        }
      )
    }

    success(`Berhasil mengambil ${dnsRecords.length} DNS records dari Resend`)
    return dnsRecords

  } catch (err) {
    error(`Gagal mengambil DNS records dari Resend: ${err.message}`)
    return null
  }
}

// Step 2: Ambil domain ID dari Vercel
async function getVercelDomainId(domain, vercelToken) {
  info('Mencari domain di Vercel...')

  try {
    // Ambil semua domains dari Vercel
    const domainsResponse = await fetchAPI('https://api.vercel.com/v4/domains', {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    // Cari domain yang cocok
    const domainData = domainsResponse.domains.find(d => d.name === domain || d.name === `www.${domain}`)

    if (!domainData) {
      error(`Domain "${domain}" tidak ditemukan di Vercel`)
      info('Pastikan domain sudah ditambahkan di Vercel Dashboard')
      return null
    }

    success(`Domain ditemukan di Vercel: ${domainData.name}`)
    return domainData.name

  } catch (err) {
    error(`Gagal mencari domain di Vercel: ${err.message}`)
    return null
  }
}

// Step 3: Tambahkan DNS records ke Vercel
async function addDNSRecordsToVercel(domain, records, vercelToken) {
  info('Menambahkan DNS records ke Vercel...')

  const results = {
    success: [],
    failed: [],
  }

  for (const record of records) {
    try {
      info(`Menambahkan ${record.type} record: ${record.name}`)

      const response = await fetchAPI(`https://api.vercel.com/v4/domains/${domain}/records`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
        },
        body: JSON.stringify({
          type: record.type,
          name: record.name,
          value: record.value,
          ttl: 3600,
        }),
      })

      success(`✓ ${record.type} ${record.name} → ${record.value.substring(0, 50)}${record.value.length > 50 ? '...' : ''}`)
      results.success.push(record)

    } catch (err) {
      error(`✗ ${record.type} ${record.name}: ${err.message}`)
      results.failed.push({ record, error: err.message })

      // Cek jika error karena record sudah ada
      if (err.message.includes('already exists') || err.message.includes('conflict')) {
        warning(`  Record ${record.type} ${record.name} sudah ada, dilewati`)
        results.success.push(record) // Anggap sukses karena sudah ada
        results.failed.pop()
      }
    }
  }

  return results
}

// Step 4: Verifikasi DNS records di Vercel
async function verifyVercelDNSRecords(domain, vercelToken) {
  info('Memverifikasi DNS records di Vercel...')

  try {
    const response = await fetchAPI(`https://api.vercel.com/v4/domains/${domain}/records`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
      },
    })

    success(`Ditemukan ${response.records.length} DNS records di Vercel`)

    return response.records
  } catch (err) {
    error(`Gagal memverifikasi DNS records: ${err.message}`)
    return []
  }
}

// Main function
async function main() {
  console.log('\n' + '='.repeat(60))
  log('🚀 Setup Otomatis DNS Records dari Resend ke Vercel', 'cyan')
  log('='.repeat(60) + '\n')

  // Load environment variables
  const env = loadEnv()

  // Cek apakah VERCEL_API_TOKEN sudah diset
  if (!env.VERCEL_API_TOKEN) {
    error('VERCEL_API_TOKEN belum diset!')
    info('\nCara membuat Vercel API Token:')
    info('1. Buka: https://vercel.com/account/tokens')
    info('2. Klik "Create Token"')
    info('3. Beri nama (contoh: "DNS Setup")')
    info('4. Pilih scope: Full Account (atau minimal Domains - Edit)')
    info('5. Copy token yang muncul')
    info('6. Tambahkan ke file .env: VERCEL_API_TOKEN=re_xxxxxxxxx\n')
    process.exit(1)
  }

  // Cek apakah DOMAIN_NAME sudah diset
  if (!env.DOMAIN_NAME) {
    error('DOMAIN_NAME belum diset!')
    info('Tambahkan ke file .env: DOMAIN_NAME=namadomain.com\n')
    process.exit(1)
  }

  // Validasi config
  if (!validateConfig(env)) {
    process.exit(1)
  }

  const { RESEND_API_KEY, VERCEL_API_TOKEN, DOMAIN_NAME } = env

  // Bersihkan domain name (hapus http, www, dll)
  const cleanDomain = DOMAIN_NAME
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .trim()

  info(`Domain target: ${cleanDomain}\n`)

  // Step 1: Ambil DNS records dari Resend
  const resendRecords = await getResendDNSRecords(cleanDomain, RESEND_API_KEY)

  if (!resendRecords || resendRecords.length === 0) {
    error('Gagal mengambil DNS records dari Resend')
    info('Pastikan domain sudah ditambahkan di: https://resend.com/domains/add\n')
    process.exit(1)
  }

  // Tampilkan DNS records yang akan ditambahkan
  log('\n📋 DNS Records yang akan ditambahkan:', 'bright')
  console.log('─'.repeat(60))
  console.table(
    resendRecords.map((r, i) => ({
      No: i + 1,
      Type: r.type,
      Name: r.name,
      Value: r.value.substring(0, 50) + (r.value.length > 50 ? '...' : ''),
    }))
  )
  console.log('─'.repeat(60) + '\n')

  // Konfirmasi
  info('Menunggu 3 detik sebelum melanjutkan...\n')
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Step 2: Cari domain di Vercel
  const vercelDomain = await getVercelDomainId(cleanDomain, VERCEL_API_TOKEN)

  if (!vercelDomain) {
    error('Domain tidak ditemukan di Vercel')
    info('Pastikan domain sudah ditambahkan di Vercel Dashboard\n')
    process.exit(1)
  }

  // Step 3: Tambahkan DNS records
  const results = await addDNSRecordsToVercel(vercelDomain, resendRecords, VERCEL_API_TOKEN)

  // Step 4: Verifikasi DNS records
  log('\n🔍 Memverifikasi DNS Records di Vercel...', 'bright')
  await new Promise(resolve => setTimeout(resolve, 2000)) // Tunggu 2 detik
  const vercelRecords = await verifyVercelDNSRecords(vercelDomain, VERCEL_API_TOKEN)

  // Tampilkan hasil akhir
  console.log('\n' + '='.repeat(60))
  log('📊 Hasil Akhir', 'cyan')
  log('='.repeat(60))

  if (results.success.length > 0) {
    success(`Berhasil menambahkan ${results.success.length} DNS records`)
  }

  if (results.failed.length > 0) {
    error(`Gagal menambahkan ${results.failed.length} DNS records`)
  }

  // Tampilkan semua DNS records di Vercel
  if (vercelRecords.length > 0) {
    log('\n📋 Semua DNS Records di Vercel:', 'bright')
    console.log('─'.repeat(60))
    console.table(
      vercelRecords.map((r, i) => ({
        No: i + 1,
        Type: r.type,
        Name: r.name,
        Value: r.value.substring(0, 40) + (r.value.length > 40 ? '...' : ''),
        TTL: r.ttl,
      }))
    )
    console.log('─'.repeat(60))
  }

  console.log('\n' + '='.repeat(60))
  log('⏳ Langkah Selanjutnya:', 'cyan')
  log('='.repeat(60))
  info('1. Tunggu 5-30 menit untuk propagasi DNS')
  info('2. Buka Resend Dashboard: https://resend.com/domains')
  info('3. Cek status verifikasi domain Anda')
  info('4. Klik Refresh sampai status: ✅ Verified')
  info('5. Beritahu developer untuk update kode email pengirim')
  log('='.repeat(60) + '\n')

  success('Setup DNS selesai! 🎉\n')
}

// Jalankan main function
main().catch(err => {
  error(`Error: ${err.message}`)
  console.error(err)
  process.exit(1)
})
