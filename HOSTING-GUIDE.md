# Configuración para Hosting Gratuito

## Vercel (Recomendado)
1. Conectar repositorio GitHub
2. Configurar variables de entorno:
   - NODE_ENV=production
   - JWT_SECRET=tu-secreto
   - DATABASE_URL=file:./database/jewelry_inventory.db

## Netlify
1. Conectar repositorio GitHub
2. Build command: npm run build
3. Publish directory: client/build

## Render
1. Conectar repositorio GitHub
2. Environment: Node
3. Build Command: npm install && npm run build
4. Start Command: npm start

## Railway
1. Conectar repositorio GitHub
2. Auto-deploy activado
3. Variables de entorno configuradas

## Notas Importantes:
- SQLite funciona en Vercel y Railway
- Para otros hosts, considerar PostgreSQL
- Backup automático configurado
- Rate limiting activado