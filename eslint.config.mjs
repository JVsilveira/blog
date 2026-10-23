import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([...nextVitals, ...nextTs, globalIgnores(['output/**', 'out/**', '.next/**', 'next-env.d.ts', 'admin/.next/**', 'admin/next-env.d.ts', '.editorial-admin/**'])]);
