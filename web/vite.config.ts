import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const aiResponseLogPath = resolve(dirname(fileURLToPath(import.meta.url)), '../logs/ai-responses.jsonl')
let aiResponseLogWrites = Promise.resolve()

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'development-ai-response-log',
      configureServer(server) {
        server.middlewares.use('/__dev/ai-response-log', (request, response, next) => {
          if (request.method !== 'POST') {
            next()
            return
          }
          let body = ''
          request.setEncoding('utf8')
          request.on('data', (chunk) => {
            body += chunk
            if (body.length > 1_000_000) request.destroy()
          })
          request.on('end', () => {
            aiResponseLogWrites = aiResponseLogWrites.catch(() => undefined).then(async () => {
              const entry = JSON.parse(body) as Record<string, unknown>
              const previous = await readFile(aiResponseLogPath, 'utf8').catch(() => '')
              const lines = previous.split('\n').filter(Boolean)
              lines.push(JSON.stringify(entry))
              await mkdir(dirname(aiResponseLogPath), { recursive: true })
              await writeFile(aiResponseLogPath, `${lines.slice(-10).join('\n')}\n`)
            })
            aiResponseLogWrites.then(
              () => {
                response.statusCode = 204
                response.end()
              },
              () => {
                response.statusCode = 400
                response.end()
              },
            )
          })
        })
      },
    },
  ],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
