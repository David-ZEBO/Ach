import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 5173 : c'est celui déclaré dans les URL de redirection Supabase (auth/callback, reset-password).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
