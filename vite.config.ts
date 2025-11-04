import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
          data: path.resolve(__dirname, 'src/data'),
          'data/': path.resolve(__dirname, 'src/data/'),
          hooks: path.resolve(__dirname, 'src/hooks'),
          'hooks/': path.resolve(__dirname, 'src/hooks/'),
          services: path.resolve(__dirname, 'src/services'),
          'services/': path.resolve(__dirname, 'src/services/'),
          types: path.resolve(__dirname, 'src/types.ts'),
          'types/': path.resolve(__dirname, 'src/types/'),
          utils: path.resolve(__dirname, 'src/utils.ts'),
          'utils/': path.resolve(__dirname, 'src/utils/'),
        }
      }
    };
});
