import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '')
    return {
        plugins: [vue(),
            VitePWA({
                registerType: 'autoUpdate',

                manifest: {
                    name: 'OnTime Business Panel',
                    short_name: 'OnTime',
                    description: 'Biznes uchun navbat va jadval boshqaruvi',

                    theme_color: '#4f46e5',
                    background_color: '#0f172a',

                    display: 'standalone',

                    start_url: '/',
                    scope: '/',

                    icons: [
                        {
                            src: '/pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: '/pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        }
                    ]
                }
            })
        ],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
            },
        },
        server: {
            port: 5174,
            proxy: {
                '/api': {
                    target: env.VITE_API_BASE_URL,
                    changeOrigin: true,
                },
                '/media': {
                    target: env.VITE_API_BASE_URL,
                    changeOrigin: true,
                },
                '/uploads': {
                    target: env.VITE_API_BASE_URL,
                    changeOrigin: true,
                },
            },
        },
        preview: {
            port: 5174,
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules')) {
                            if (id.includes('vue') || id.includes('pinia') || id.includes('vue-router')) {
                                return 'vendor-vue'
                            }
                            if (id.includes('axios')) {
                                return 'vendor-http'
                            }
                        }
                    },
                },
            },
        },
    }
})
