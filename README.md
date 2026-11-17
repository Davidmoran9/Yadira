# Para Yadira

Pagina estatica (HTML, CSS y JS, sin build). Ajustes en el bloque CONFIG al inicio de `app.js`:
`de` (tu nombre en la firma), `whatsapp` (tu numero con pais, sin +), `videoId` y `volumen`.

## Probar en local
    python -m http.server 4173   # y abrir http://localhost:4173

## Desplegar en Render
1. Sube esta carpeta a un repositorio de GitHub (la raiz del repo debe ser esta carpeta).
2. En Render: New > Static Site, conecta el repo. Build command: vacio. Publish directory: `.`
   (o usa Blueprint con `render.yaml`).
3. La musica usa el reproductor de YouTube, funciona en cualquier dominio con HTTPS.
